import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Lock, 
  Clock, 
  FileText, 
  Download, 
  Award,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Video,
  HelpCircle,
  FileDown,
  Target,
  RotateCcw
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const CourseLearning = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [currentModule, setCurrentModule] = useState(0)
  const [currentLecture, setCurrentLecture] = useState(0)
  const [loading, setLoading] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [showFinalTest, setShowFinalTest] = useState(false)
  const [finalTestAnswers, setFinalTestAnswers] = useState({})
  const [testTimeLeft, setTestTimeLeft] = useState(null)

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData()
      fetchProgress()
    }
  }, [courseId, user])

  useEffect(() => {
    let timer
    if (testTimeLeft > 0) {
      timer = setInterval(() => {
        setTestTimeLeft(prev => {
          if (prev <= 1) {
            handleFinalTestSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [testTimeLeft])

  const fetchCourseData = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}`)
      setCourse(data.course)
    } catch (error) {
      toast.error('Failed to load course')
      navigate('/courses')
    }
  }

  const fetchProgress = async () => {
    try {
      const { data } = await api.get(`/progress/${courseId}`)
      setProgress(data.progress)
      
      // Set current position based on progress
      if (data.progress.currentModule !== undefined) {
        setCurrentModule(data.progress.currentModule)
      }
      if (data.progress.currentLecture !== undefined) {
        setCurrentLecture(data.progress.currentLecture)
      }
    } catch (error) {
      toast.error('Failed to load progress')
    } finally {
      setLoading(false)
    }
  }

  const updateLectureProgress = async (lectureId, updates) => {
    try {
      const { data } = await api.put(`/progress/${courseId}/lecture/${lectureId}`, updates)
      setProgress(data.progress)
      if (updates.completed) {
        toast.success('Lecture completed!')
      }
    } catch (error) {
      toast.error('Failed to update progress')
    }
  }

  const handleVideoProgress = (percentage) => {
    setVideoProgress(percentage)
    const lecture = getCurrentLecture()
    if (lecture && percentage > 0) {
      // Update progress every 10% watched
      if (Math.floor(percentage / 10) > Math.floor(videoProgress / 10)) {
        updateLectureProgress(lecture._id, {
          watchedPercentage: percentage,
          timeSpent: 1 // Add 1 minute of watch time
        })
      }
    }
  }

  const markLectureComplete = () => {
    const lecture = getCurrentLecture()
    if (lecture) {
      updateLectureProgress(lecture._id, {
        completed: true,
        watchedPercentage: 100,
        timeSpent: 2
      })
    }
  }

  const handleQuizSubmit = async () => {
    const lecture = getCurrentLecture()
    if (!lecture || !lecture.quiz) return

    try {
      const { data } = await api.post(`/progress/${courseId}/lecture/${lecture._id}/submit`, {
        answers: Object.values(quizAnswers),
        timeSpent: 5
      })
      
      toast.success(`Quiz completed! Score: ${data.score}%`)
      setShowQuiz(false)
      setQuizAnswers({})
      fetchProgress()
    } catch (error) {
      toast.error('Failed to submit quiz')
    }
  }

  const handleFinalTestSubmit = async () => {
    if (!course?.finalTest) return

    try {
      const { data } = await api.post(`/progress/${courseId}/final-test`, {
        answers: Object.values(finalTestAnswers),
        timeSpent: Math.floor((course.finalTest.timeLimit * 60 - testTimeLeft) / 60)
      })
      
      if (data.passed) {
        toast.success(`Congratulations! You passed with ${data.percentage}%`)
      } else {
        toast.error(`Test completed. Score: ${data.percentage}%`)
      }
      
      setShowFinalTest(false)
      setFinalTestAnswers({})
      setTestTimeLeft(null)
      fetchProgress()
    } catch (error) {
      toast.error('Failed to submit test')
    }
  }

  const startFinalTest = () => {
    if (!progress?.canTakeFinalTest || !progress.canTakeFinalTest()) {
      toast.error('Complete all modules first')
      return
    }
    
    setShowFinalTest(true)
    setTestTimeLeft(course.finalTest.timeLimit * 60) // Convert to seconds
    setFinalTestAnswers({})
  }

  const getCurrentLecture = () => {
    if (!course?.modules || !course.modules[currentModule]) return null
    return course.modules[currentModule].lectures[currentLecture]
  }

  const getCurrentModule = () => {
    if (!course?.modules) return null
    return course.modules[currentModule]
  }

  const isModuleUnlocked = (moduleIndex) => {
    if (!progress?.modules) return moduleIndex === 0
    return progress.modules[moduleIndex]?.isUnlocked || false
  }

  const isLectureCompleted = (moduleIndex, lectureIndex) => {
    if (!progress?.modules) return false
    const module = progress.modules[moduleIndex]
    if (!module) return false
    const lecture = module.lectures[lectureIndex]
    return lecture?.completed || false
  }

  const navigateToLecture = (moduleIndex, lectureIndex) => {
    if (!isModuleUnlocked(moduleIndex)) {
      toast.error('Complete previous modules to unlock this one')
      return
    }
    
    setCurrentModule(moduleIndex)
    setCurrentLecture(lectureIndex)
    setShowQuiz(false)
  }

  const nextLecture = () => {
    const currentModuleData = getCurrentModule()
    if (!currentModuleData) return

    if (currentLecture < currentModuleData.lectures.length - 1) {
      setCurrentLecture(currentLecture + 1)
    } else if (currentModule < course.modules.length - 1) {
      if (isModuleUnlocked(currentModule + 1)) {
        setCurrentModule(currentModule + 1)
        setCurrentLecture(0)
      }
    }
  }

  const previousLecture = () => {
    if (currentLecture > 0) {
      setCurrentLecture(currentLecture - 1)
    } else if (currentModule > 0) {
      const prevModule = course.modules[currentModule - 1]
      setCurrentModule(currentModule - 1)
      setCurrentLecture(prevModule.lectures.length - 1)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderLectureContent = () => {
    const lecture = getCurrentLecture()
    if (!lecture) return null

    switch (lecture.type) {
      case 'video':
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-4">{lecture.title}</p>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center px-6 py-3 bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    {isPlaying ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={markLectureComplete}
                    className="flex items-center px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark Complete
                  </button>
                </div>
                <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <p className="text-sm mt-2">{Math.round(videoProgress)}% watched</p>
              </div>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">{lecture.title}</h3>
            <div className="prose max-w-none">
              <p>{lecture.content || 'Text content would be displayed here.'}</p>
            </div>
            <div className="mt-6">
              <button
                onClick={markLectureComplete}
                className="btn btn-primary"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Mark as Read
              </button>
            </div>
          </div>
        )

      case 'quiz':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">{lecture.title}</h3>
            <p className="text-gray-600 mb-6">{lecture.description}</p>
            
            {!showQuiz ? (
              <div className="text-center">
                <HelpCircle className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                <p className="text-lg mb-4">Ready to test your knowledge?</p>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="btn btn-primary"
                >
                  Start Quiz
                </button>
              </div>
            ) : (
              <div>
                {lecture.quiz.questions.map((question, index) => (
                  <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold mb-3">{question.question}</h4>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={optionIndex}
                            onChange={(e) => setQuizAnswers({
                              ...quizAnswers,
                              [index]: parseInt(e.target.value)
                            })}
                            className="mr-3"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleQuizSubmit}
                  className="btn btn-primary"
                  disabled={Object.keys(quizAnswers).length !== lecture.quiz.questions.length}
                >
                  Submit Quiz
                </button>
              </div>
            )}
          </div>
        )

      case 'resource':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">{lecture.title}</h3>
            <p className="text-gray-600 mb-6">{lecture.description}</p>
            
            {lecture.resources && lecture.resources.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">Resources:</h4>
                {lecture.resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <FileDown className="h-5 w-5 text-primary-600 mr-3" />
                      <div>
                        <p className="font-medium">{resource.name}</p>
                        <p className="text-sm text-gray-500">{resource.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={markLectureComplete}
                className="btn btn-primary"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Mark Complete
              </button>
            </div>
          </div>
        )

      default:
        return (
          <div className="card text-center">
            <p>Lecture content not available</p>
          </div>
        )
    }
  }

  const renderFinalTest = () => {
    if (!showFinalTest || !course?.finalTest) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{course.finalTest.title}</h2>
            <div className="text-lg font-semibold text-red-600">
              Time Left: {formatTime(testTimeLeft)}
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">{course.finalTest.description}</p>
          
          {course.finalTest.questions.map((question, index) => (
            <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold mb-3">
                {index + 1}. {question.question} ({question.points} points)
              </h4>
              
              {question.type === 'multiple-choice' && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center">
                      <input
                        type="radio"
                        name={`final-question-${index}`}
                        value={optionIndex}
                        onChange={(e) => setFinalTestAnswers({
                          ...finalTestAnswers,
                          [index]: parseInt(e.target.value)
                        })}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'true-false' && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center">
                      <input
                        type="radio"
                        name={`final-question-${index}`}
                        value={optionIndex}
                        onChange={(e) => setFinalTestAnswers({
                          ...finalTestAnswers,
                          [index]: parseInt(e.target.value)
                        })}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'short-answer' && (
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Enter your answer..."
                  onChange={(e) => setFinalTestAnswers({
                    ...finalTestAnswers,
                    [index]: e.target.value
                  })}
                />
              )}
            </div>
          ))}
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowFinalTest(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalTestSubmit}
              className="btn btn-primary"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  const currentModuleData = getCurrentModule()
  const currentLectureData = getCurrentLecture()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="btn btn-outline mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </button>
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-gray-600">
              Module {currentModule + 1}: {currentModuleData?.title}
            </p>
          </div>
        </div>
        
        {progress?.overallProgress !== undefined && (
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${progress.overallProgress}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{progress.overallProgress}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Course Modules */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h3 className="font-semibold mb-4">Course Modules</h3>
            <div className="space-y-2">
              {course.modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 rounded-lg">
                  <div className={`p-3 ${moduleIndex === currentModule ? 'bg-primary-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{module.title}</h4>
                      {isModuleUnlocked(moduleIndex) ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    {moduleIndex === currentModule && (
                      <div className="mt-2 space-y-1">
                        {module.lectures.map((lecture, lectureIndex) => (
                          <button
                            key={lectureIndex}
                            onClick={() => navigateToLecture(moduleIndex, lectureIndex)}
                            className={`w-full text-left p-2 rounded text-sm flex items-center justify-between ${
                              lectureIndex === currentLecture ? 'bg-primary-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex items-center">
                              {lecture.type === 'video' && <Video className="h-3 w-3 mr-2" />}
                              {lecture.type === 'quiz' && <HelpCircle className="h-3 w-3 mr-2" />}
                              {lecture.type === 'text' && <FileText className="h-3 w-3 mr-2" />}
                              {lecture.type === 'resource' && <FileDown className="h-3 w-3 mr-2" />}
                              {lecture.title}
                            </span>
                            {isLectureCompleted(moduleIndex, lectureIndex) && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Final Test Button */}
            {course.finalTest?.isEnabled && (
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={startFinalTest}
                  disabled={!progress?.canTakeFinalTest?.()}
                  className={`w-full btn ${
                    progress?.canTakeFinalTest?.() ? 'btn-primary' : 'btn-disabled'
                  }`}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Final Test
                </button>
                {progress?.finalTestPassed && (
                  <div className="mt-2 text-center text-sm text-green-600">
                    ✓ Passed ({progress.finalTestScore}%)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {/* Lecture Content */}
            {renderLectureContent()}
            
            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={previousLecture}
                disabled={currentModule === 0 && currentLecture === 0}
                className="btn btn-outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>
              
              <button
                onClick={nextLecture}
                className="btn btn-primary"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Final Test Modal */}
      {renderFinalTest()}
    </div>
  )
}

export default CourseLearning
