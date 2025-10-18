import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { unenrollCourse } from '../store/slices/enrollmentsSlice'
import { 
  Play, 
  CheckCircle, 
  Lock, 
  Clock, 
  Award, 
  BookOpen, 
  FileText, 
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  X,
  AlertTriangle
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const LearnCourse = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  
  const [course, setCourse] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [progress, setProgress] = useState(null)
  const [currentModule, setCurrentModule] = useState(0)
  const [currentLecture, setCurrentLecture] = useState(0)
  const [expandedModules, setExpandedModules] = useState(new Set([0]))
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false)

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData()
    }
  }, [courseId, user])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      
      // Fetch course details
      const courseRes = await api.get(`/courses/${courseId}`)
      setCourse(courseRes.data.course)
      
      // Fetch enrollment and progress
      const enrollmentRes = await api.get('/enrollments/my')
      const userEnrollment = enrollmentRes.data.enrollments.find(
        e => e.course._id === courseId
      )
      
      if (!userEnrollment) {
        toast.error('You are not enrolled in this course')
        navigate('/courses')
        return
      }
      
      setEnrollment(userEnrollment)
      
      // Fetch detailed progress
      const progressRes = await api.get(`/progress/${courseId}`)
      setProgress(progressRes.data.progress)
      
    } catch (error) {
      console.error('Error fetching course data:', error)
      toast.error('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleIndex) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex)
    } else {
      newExpanded.add(moduleIndex)
    }
    setExpandedModules(newExpanded)
  }

  const selectLecture = (moduleIndex, lectureIndex) => {
    setCurrentModule(moduleIndex)
    setCurrentLecture(lectureIndex)
    setShowQuiz(false)
    setQuizSubmitted(false)
    setQuizResults(null)
    setQuizAnswers({})
  }

  const markLectureComplete = async () => {
    try {
      if (!course || !course.modules || !course.modules[currentModule] || !course.modules[currentModule].lectures || !course.modules[currentModule].lectures[currentLecture]) {
        toast.error('Unable to access lecture data')
        return
      }
      
      const lecture = course.modules[currentModule].lectures[currentLecture]
      const currentModuleData = course.modules[currentModule]
      
      await api.put(`/progress/${courseId}/lecture`, {
        moduleIndex: currentModule,
        lectureIndex: currentLecture,
        completed: true,
        watchedPercentage: 100
      })
      
      toast.success('✅ Lecture completed!')
      
      // Refresh progress first
      await fetchCourseData()
      
      // Check if lecture has a quiz
      if (lecture.quiz && lecture.quiz.questions.length > 0) {
        setShowQuiz(true)
        toast.info('📝 Please complete the quiz to continue')
      } else {
        // Check if this is the last lecture in the module
        const isLastLectureInModule = currentLecture === currentModuleData.lectures.length - 1
        
        if (isLastLectureInModule) {
          // Calculate module progress
          const completedLectures = currentLecture + 1
          const totalLectures = currentModuleData.lectures.length
          const moduleProgress = Math.round((completedLectures / totalLectures) * 100)
          
          if (moduleProgress === 100) {
            toast.success(`🎉 Module "${currentModuleData.title}" completed (${moduleProgress}%)!`)
          }
        }
        
        // Move to next lecture or show completion
        setTimeout(() => {
          moveToNextLecture()
        }, 1000)
      }
      
    } catch (error) {
      console.error('Error marking lecture complete:', error)
      toast.error('Failed to mark lecture as complete')
    }
  }

  const submitQuiz = async () => {
    try {
      if (!course || !course.modules || !course.modules[currentModule] || !course.modules[currentModule].lectures || !course.modules[currentModule].lectures[currentLecture]) {
        toast.error('Unable to access lecture data')
        return
      }
      
      const lecture = course.modules[currentModule].lectures[currentLecture]
      const quiz = lecture?.quiz
      
      if (!quiz || !quiz.questions) {
        toast.error('Quiz data not available')
        return
      }
      
      let score = 0
      let totalPoints = 0
      const results = []
      
      quiz.questions.forEach((question, index) => {
        const userAnswer = quizAnswers[index]
        const isCorrect = userAnswer === question.correctAnswer
        
        if (isCorrect) {
          score += question.points
        }
        totalPoints += question.points
        
        results.push({
          questionIndex: index,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          points: isCorrect ? question.points : 0
        })
      })
      
      const percentage = (score / totalPoints) * 100
      const passed = percentage >= quiz.passingScore
      
      setQuizResults({
        score,
        totalPoints,
        percentage,
        passed,
        results
      })
      
      // Submit quiz results to backend
      await api.put(`/progress/${courseId}/quiz`, {
        moduleIndex: currentModule,
        lectureIndex: currentLecture,
        score,
        percentage,
        passed,
        answers: quizAnswers
      })
      
      setQuizSubmitted(true)
      
      if (passed) {
        toast.success(`✅ Quiz passed! Score: ${percentage.toFixed(1)}%`)
        // Move to next lecture after a delay
        setTimeout(() => {
          moveToNextLecture()
        }, 2000)
      } else {
        toast.error(`❌ Quiz failed. You need ${quiz.passingScore}% to pass. You scored ${percentage.toFixed(1)}%`)
        // Allow retry
        setQuizSubmitted(true)
      }
      
      // Refresh progress
      await fetchCourseData()
      
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error('Failed to submit quiz')
    }
  }

  const checkCourseCompletion = () => {
    if (!progress || !progress.modules || !course || !course.modules) {
      return false
    }

    // Check if all modules are completed
    for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
      const module = course.modules[moduleIndex]
      const progressModule = progress.modules[moduleIndex]
      
      if (!progressModule) return false

      // Check if all lectures in the module are completed
      for (let lectureIndex = 0; lectureIndex < module.lectures.length; lectureIndex++) {
        const lectureProgress = progressModule.lectures.find(
          l => l.lectureIndex === lectureIndex
        )
        
        if (!lectureProgress || !lectureProgress.completed) {
          return false
        }
      }
    }

    return true
  }

  const completeCourse = async () => {
    try {
      const { data } = await api.post(`/progress/${courseId}/complete`)
      
      if (data.success) {
        toast.success('🎊 Congratulations! Course completed successfully!')
        
        // Show certificate info if generated
        if (data.certificate) {
          toast.success('🏆 Certificate generated! Redirecting to certificate page...')
        }
        
        // Refresh progress data
        await fetchCourseData()
        
        // Navigate to certificate page after a delay
        setTimeout(() => {
          navigate(`/courses/${courseId}/certificate`)
        }, 2000)
      }
    } catch (error) {
      console.error('Error completing course:', error)
      toast.error(error.response?.data?.message || 'Failed to complete course')
    }
  }

  const handleUnenrollClick = () => {
    setShowUnenrollDialog(true)
  }

  const handleUnenrollConfirm = async () => {
    try {
      await dispatch(unenrollCourse(courseId)).unwrap()
      toast.success('Successfully unenrolled from course')
      navigate('/dashboard')
    } catch (error) {
      console.error('Error unenrolling:', error)
      toast.error(error.message || 'Failed to unenroll from course')
    } finally {
      setShowUnenrollDialog(false)
    }
  }

  const handleUnenrollCancel = () => {
    setShowUnenrollDialog(false)
  }

  const moveToNextLecture = () => {
    if (!course || !course.modules || !course.modules[currentModule]) {
      toast.error('Unable to navigate to next lecture')
      return
    }
    
    const currentModuleData = course.modules[currentModule]
    
    if (currentLecture < currentModuleData.lectures.length - 1) {
      // Move to next lecture in same module
      setCurrentLecture(currentLecture + 1)
      setShowQuiz(false)
      setQuizSubmitted(false)
      setQuizResults(null)
      setQuizAnswers({})
      toast.success('Moving to next lecture...')
    } else if (currentModule < course.modules.length - 1) {
      // Module completed, move to first lecture of next module
      toast.success('🎉 Module completed! Moving to next module...')
      
      setTimeout(() => {
        setCurrentModule(currentModule + 1)
        setCurrentLecture(0)
        setExpandedModules(prev => new Set([...prev, currentModule + 1]))
        setShowQuiz(false)
        setQuizSubmitted(false)
        setQuizResults(null)
        setQuizAnswers({})
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 1500)
    } else {
      // Last lecture of last module - check if course is complete
      const isComplete = checkCourseCompletion()
      
      if (isComplete) {
        toast.success('🎊 Congratulations! You have completed the entire course!')
        
        setTimeout(() => {
          navigate(`/courses/${courseId}/certificate`)
        }, 2000)
      } else {
        toast.success('Lecture completed!')
        setShowQuiz(false)
        setQuizSubmitted(false)
        setQuizResults(null)
        setQuizAnswers({})
      }
    }
  }

  const getLectureProgress = (moduleIndex, lectureIndex) => {
    if (!progress || !progress.modules[moduleIndex]) return { completed: false, score: null }
    
    const moduleProgress = progress.modules[moduleIndex]
    const lectureProgress = moduleProgress.lectures.find(
      l => l.lectureIndex === lectureIndex
    )
    
    return lectureProgress || { completed: false, score: null }
  }

  const isLectureUnlocked = (moduleIndex, lectureIndex) => {
    // First lecture is always unlocked
    if (moduleIndex === 0 && lectureIndex === 0) return true
    
    if (!course || !course.modules || !course.modules[moduleIndex]) {
      return false
    }
    
    // Check if previous lecture is completed
    if (lectureIndex > 0) {
      const prevLectureProgress = getLectureProgress(moduleIndex, lectureIndex - 1)
      return prevLectureProgress.completed
    }
    
    // First lecture of module - check if previous module is completed
    if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1]
      if (!prevModule || !prevModule.lectures) return false
      
      const lastLectureProgress = getLectureProgress(moduleIndex - 1, prevModule.lectures.length - 1)
      return lastLectureProgress.completed
    }
    
    return false
  }

  const renderVideoPlayer = () => {
    if (!course || !course.modules || !course.modules[currentModule] || !course.modules[currentModule].lectures || !course.modules[currentModule].lectures[currentLecture]) {
      return null
    }
    
    const lecture = course.modules[currentModule].lectures[currentLecture]
    
    if (lecture?.type !== 'video') return null
    
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        {lecture.videoUrl ? (
          <video
            controls
            className="w-full h-full"
            onTimeUpdate={(e) => {
              const progress = (e.target.currentTime / e.target.duration) * 100
              setVideoProgress(progress)
            }}
            onEnded={markLectureComplete}
          >
            <source src={lecture.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <p>Video not available</p>
          </div>
        )}
      </div>
    )
  }

  const renderTextContent = () => {
    if (!course || !course.modules || !course.modules[currentModule] || !course.modules[currentModule].lectures || !course.modules[currentModule].lectures[currentLecture]) {
      return null
    }
    
    const lecture = course.modules[currentModule].lectures[currentLecture]
    
    if (lecture?.type !== 'text') return null
    
    return (
      <div className="prose max-w-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="whitespace-pre-wrap">
            {lecture.content}
          </div>
          <div className="mt-6">
            <button
              onClick={markLectureComplete}
              className="btn btn-primary"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAssignmentContent = () => {
    if (!course || !course.modules || !course.modules[currentModule] || !course.modules[currentModule].lectures || !course.modules[currentModule].lectures[currentLecture]) {
      return null
    }
    
    const lecture = course.modules[currentModule].lectures[currentLecture]
    
    if (lecture?.type !== 'assignment') return null
    
    return (
      <div className="prose max-w-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Assignment</h3>
          </div>
          
          {lecture.content && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Instructions:</h4>
              <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {lecture.content}
              </div>
            </div>
          )}
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Submit Your Assignment</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload your completed assignment file
            </p>
            <input
              type="file"
              className="hidden"
              id="assignment-upload"
              accept=".pdf,.doc,.docx,.txt"
            />
            <label
              htmlFor="assignment-upload"
              className="btn btn-outline cursor-pointer"
            >
              Choose File
            </label>
          </div>
          
          <div className="mt-6">
            <button
              onClick={markLectureComplete}
              className="btn btn-primary"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderQuizContent = () => {
    if (!course || !course.modules || !course.modules[currentModule] || !course.modules[currentModule].lectures || !course.modules[currentModule].lectures[currentLecture]) {
      return null
    }
    
    const lecture = course.modules[currentModule].lectures[currentLecture]
    
    if (lecture?.type !== 'quiz') return null
    
    return (
      <div className="prose max-w-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <HelpCircle className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">Quiz</h3>
          </div>
          
          {lecture.content && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Instructions:</h4>
              <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {lecture.content}
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 text-center">
            <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Ready to Take the Quiz?</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Test your knowledge with this interactive quiz
            </p>
            <button
              onClick={() => setShowQuiz(true)}
              className="btn btn-primary"
            >
              Start Quiz
            </button>
          </div>
          
          <div className="mt-6">
            <button
              onClick={markLectureComplete}
              className="btn btn-outline"
            >
              Skip Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDefaultContent = () => {
    if (!course || !course.modules || !course.modules[currentModule] || !course.modules[currentModule].lectures || !course.modules[currentModule].lectures[currentLecture]) {
      return null
    }
    
    const lecture = course.modules[currentModule].lectures[currentLecture]
    
    // Only render if no other content type matched
    if (['video', 'text', 'assignment', 'quiz'].includes(lecture?.type)) {
      return null
    }
    
    return (
      <div className="prose max-w-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="h-6 w-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold">Lecture Content</h3>
          </div>
          
          {lecture.content ? (
            <div className="mb-6">
              <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {lecture.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content available for this lecture</p>
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={markLectureComplete}
              className="btn btn-primary"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderQuiz = () => {
    if (!course || !course.modules || !course.modules[currentModule] || !course.modules[currentModule].lectures || !course.modules[currentModule].lectures[currentLecture]) {
      return null
    }
    
    const lecture = course.modules[currentModule].lectures[currentLecture]
    const quiz = lecture?.quiz
    
    if (!showQuiz || !quiz || !quiz.questions || quiz.questions.length === 0) return null
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Module Quiz</h3>
          <div className="text-sm text-gray-500">
            Passing Score: {quiz.passingScore}% | Time Limit: {quiz.timeLimit} minutes
          </div>
        </div>
        
        {!quizSubmitted ? (
          <div className="space-y-6">
            {quiz.questions.map((question, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-4">
                  {index + 1}. {question.question}
                </h4>
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optIndex}
                        checked={quizAnswers[index] === optIndex}
                        onChange={(e) => setQuizAnswers(prev => ({
                          ...prev,
                          [index]: parseInt(e.target.value)
                        }))}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="flex justify-end">
              <button
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length !== quiz.questions.length}
                className="btn btn-primary"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className={`text-6xl mb-4 ${quizResults.passed ? 'text-green-500' : 'text-red-500'}`}>
              {quizResults.passed ? '🎉' : '😞'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${quizResults.passed ? 'text-green-600' : 'text-red-600'}`}>
              {quizResults.passed ? 'Quiz Passed!' : 'Quiz Failed'}
            </h3>
            <p className="text-lg mb-4">
              Score: {quizResults.score}/{quizResults.totalPoints} ({quizResults.percentage.toFixed(1)}%)
            </p>
            
            {quizResults.passed ? (
              <p className="text-green-600 mb-4">
                Great job! Moving to the next lecture...
              </p>
            ) : (
              <div className="text-red-600 mb-4">
                <p>You need {quiz.passingScore}% to pass.</p>
                <p>Please review the material and try again.</p>
              </div>
            )}
            
            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const result = quizResults.results[index]
                return (
                  <div key={index} className={`p-4 rounded-lg ${result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                    <p className="font-medium mb-2">{index + 1}. {question.question}</p>
                    <p className="text-sm">
                      Your answer: {question.options[result.userAnswer]} 
                      {result.isCorrect ? ' ✅' : ' ❌'}
                    </p>
                    {!result.isCorrect && (
                      <p className="text-sm text-green-600">
                        Correct answer: {question.options[result.correctAnswer]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course || !enrollment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <button onClick={() => navigate('/courses')} className="btn btn-primary">
          Back to Courses
        </button>
      </div>
    )
  }

  const currentLectureData = course.modules[currentModule]?.lectures[currentLecture]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Module {currentModule + 1}: {course.modules[currentModule]?.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {progress && (
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Overall Progress</div>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${progress.overallProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{progress.overallProgress}%</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleUnenrollClick}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Unenroll from course"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Course Completion Banner */}
      {checkCourseCompletion() && !progress?.isCompleted && (
        <div className="card mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-4xl mr-4">🎉</div>
              <div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                  Congratulations! All modules completed!
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  You've finished all the course content. Complete the course to earn your certificate!
                </p>
              </div>
            </div>
            <button
              onClick={completeCourse}
              className="btn bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg font-semibold"
            >
              <Award className="h-5 w-5 mr-2" />
              Complete Course
            </button>
          </div>
        </div>
      )}

      {/* Course Already Completed Banner */}
      {progress?.isCompleted && (
        <div className="card mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-4xl mr-4">🏆</div>
              <div>
                <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                  Course Completed!
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300">
                  You have successfully completed this course. View your certificate!
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/courses/${courseId}/certificate`)}
              className="btn bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3"
            >
              <Award className="h-5 w-5 mr-2" />
              View Certificate
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Course Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Current Lecture */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {currentLectureData?.title}
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {currentLectureData?.duration} minutes
              </div>
            </div>
            
            {currentLectureData?.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {currentLectureData.description}
              </p>
            )}
            
            {/* Content based on lecture type */}
            {currentLectureData?.type === 'video' && renderVideoPlayer()}
            {currentLectureData?.type === 'text' && renderTextContent()}
            {currentLectureData?.type === 'assignment' && renderAssignmentContent()}
            {currentLectureData?.type === 'quiz' && renderQuizContent()}
            {renderDefaultContent()}
          </div>
          
          {/* Quiz */}
          {renderQuiz()}
        </div>

        {/* Course Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Course Content</h3>
              {checkCourseCompletion() && !progress?.isCompleted && (
                <button
                  onClick={completeCourse}
                  className="btn btn-primary btn-sm"
                  title="Complete Course"
                >
                  <Award className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Course Completion Status */}
            {progress?.isCompleted && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center text-green-700 dark:text-green-300">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Course Completed!</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {course.modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => toggleModule(moduleIndex)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-primary-600" />
                      <span className="font-medium text-sm">{module.title}</span>
                    </div>
                    {expandedModules.has(moduleIndex) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedModules.has(moduleIndex) && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {module.lectures.map((lecture, lectureIndex) => {
                        const lectureProgress = getLectureProgress(moduleIndex, lectureIndex)
                        const isUnlocked = isLectureUnlocked(moduleIndex, lectureIndex)
                        const isCurrent = moduleIndex === currentModule && lectureIndex === currentLecture
                        
                        return (
                          <button
                            key={lectureIndex}
                            onClick={() => isUnlocked && selectLecture(moduleIndex, lectureIndex)}
                            disabled={!isUnlocked}
                            className={`w-full flex items-center justify-between p-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                              isCurrent ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600' : ''
                            } ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center">
                              {lecture.type === 'video' && <Play className="h-3 w-3 mr-2 text-red-500" />}
                              {lecture.type === 'text' && <FileText className="h-3 w-3 mr-2 text-blue-500" />}
                              {lecture.type === 'assignment' && <FileText className="h-3 w-3 mr-2 text-orange-500" />}
                              {lecture.type === 'quiz' && <HelpCircle className="h-3 w-3 mr-2 text-green-500" />}
                              <span className={isCurrent ? 'font-medium' : ''}>{lecture.title}</span>
                            </div>
                            <div className="flex items-center">
                              {lectureProgress.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : !isUnlocked ? (
                                <Lock className="h-4 w-4 text-gray-400" />
                              ) : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Unenroll Confirmation Dialog */}
      {showUnenrollDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold">Confirm Unenrollment</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to unenroll from "{course?.title}"? 
              This action will remove all your progress and cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleUnenrollCancel}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleUnenrollConfirm}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Unenroll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LearnCourse
