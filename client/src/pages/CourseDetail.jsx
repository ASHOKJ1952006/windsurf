import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCourse } from '../store/slices/coursesSlice'
import { enrollCourse, fetchMyEnrollments, unenrollCourse } from '../store/slices/enrollmentsSlice'
import { Star, Clock, Users, BookOpen, Award, X, AlertTriangle, CheckCircle } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const CourseDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentCourse: course } = useSelector((state) => state.courses)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { enrollments } = useSelector((state) => state.enrollments)
  
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollmentData, setEnrollmentData] = useState(null)

  useEffect(() => {
    dispatch(fetchCourse(id))
    if (isAuthenticated) {
      dispatch(fetchMyEnrollments())
    }
  }, [dispatch, id, isAuthenticated])

  useEffect(() => {
    if (enrollments && id) {
      const enrollment = enrollments.find(e => e.course._id === id && e.status !== 'dropped')
      setIsEnrolled(!!enrollment)
      setEnrollmentData(enrollment)
    }
  }, [enrollments, id])

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll')
      navigate('/login')
      return
    }

    try {
      await dispatch(enrollCourse(id)).unwrap()
      toast.success('Enrolled successfully!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error || 'Enrollment failed')
    }
  }

  const handleUnenrollClick = () => {
    setShowUnenrollDialog(true)
  }

  const handleUnenrollConfirm = async () => {
    try {
      await dispatch(unenrollCourse(id)).unwrap()
      toast.success('Successfully unenrolled from course')
      setIsEnrolled(false)
      setEnrollmentData(null)
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

  if (!course) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="h-64 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg mb-6 flex items-center justify-center text-white text-9xl font-bold">
            {course.title.charAt(0)}
          </div>

          <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">{course.description}</p>

          <div className="flex items-center space-x-6 mb-8">
            <div className="flex items-center text-yellow-500">
              <Star className="h-5 w-5 fill-current mr-1" />
              <span className="font-semibold">{course.averageRating.toFixed(1)}</span>
              <span className="text-gray-500 ml-1">({course.totalRatings} ratings)</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Users className="h-5 w-5 mr-1" />
              <span>{course.enrolledCount} students</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Clock className="h-5 w-5 mr-1" />
              <span>{course.totalDuration} minutes</span>
            </div>
          </div>

          {/* What you'll learn */}
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
            <ul className="grid md:grid-cols-2 gap-3">
              {course.whatYouWillLearn?.map((item, index) => (
                <li key={index} className="flex items-start">
                  <Award className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Course Content */}
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4">Course Content</h2>
            <div className="space-y-4">
              {course.sections?.map((section, sIndex) => (
                <div key={section._id} className="border dark:border-gray-700 rounded-lg">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 font-semibold">
                    {sIndex + 1}. {section.title}
                  </div>
                  <div className="p-4 space-y-2">
                    {section.lectures?.map((lecture, lIndex) => (
                      <div key={lecture._id} className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{lIndex + 1}. {lecture.title}</span>
                          {lecture.isFree && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Free
                            </span>
                          )}
                        </div>
                        {lecture.duration && (
                          <span className="text-sm text-gray-500">{lecture.duration}m</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          {course.requirements?.length > 0 && (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                {course.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="card sticky top-20">
            <div className="mb-6">
              <div className="text-3xl font-bold mb-2">
                {course.price === 0 ? 'Free' : `$${course.price}`}
              </div>
            </div>

            {isEnrolled ? (
              <div className="space-y-3 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                  <div className="flex items-center text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Enrolled</span>
                  </div>
                  {enrollmentData && (
                    <div className="mt-2">
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Progress: {enrollmentData.completionPercentage}%
                      </div>
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${enrollmentData.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => navigate(`/courses/${id}/learn`)}
                  className="w-full btn-primary"
                >
                  Continue Learning
                </button>
                <button 
                  onClick={handleUnenrollClick}
                  className="w-full btn btn-outline text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Unenroll
                </button>
              </div>
            ) : (
              <button onClick={handleEnroll} className="w-full btn-primary mb-4">
                Enroll Now
              </button>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Level</span>
                <span className="font-semibold capitalize">{course.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Category</span>
                <span className="font-semibold">{course.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Duration</span>
                <span className="font-semibold">{course.totalDuration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Lectures</span>
                <span className="font-semibold">
                  {course.sections?.reduce((acc, s) => acc + s.lectures.length, 0)}
                </span>
              </div>
            </div>

            <hr className="my-6 dark:border-gray-700" />

            <div>
              <h3 className="font-semibold mb-3">Instructor</h3>
              <div className="flex items-center space-x-3">
                <img
                  src={course.instructor?.profilePicture}
                  alt={course.instructor?.name}
                  className="h-12 w-12 rounded-full"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${course.instructor?.name}&background=random`
                  }}
                />
                <div>
                  <div className="font-semibold">{course.instructor?.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {course.instructor?.instructorRating?.toFixed(1)} ⭐ rating
                  </div>
                </div>
              </div>
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
              This action will remove your progress and cannot be undone.
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

export default CourseDetail
