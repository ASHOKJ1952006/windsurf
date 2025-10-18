import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Star, Clock, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react'
import api from '../utils/api'
import { toast } from 'react-hot-toast'

const CourseCard = ({ course, showEnrollmentStatus = true }) => {
  const { user } = useSelector((state) => state.auth)
  const [enrollmentStatus, setEnrollmentStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (showEnrollmentStatus && user && course._id) {
      fetchEnrollmentStatus()
    }
  }, [course._id, user, showEnrollmentStatus])

  const fetchEnrollmentStatus = async () => {
    try {
      const { data } = await api.get(`/enrollments/status/${course._id}`)
      setEnrollmentStatus(data)
    } catch (error) {
      console.error('Error fetching enrollment status:', error)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll in courses')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post(`/enrollments/${course._id}`)
      toast.success(data.message || 'Successfully enrolled in course!')
      await fetchEnrollmentStatus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll in course')
    } finally {
      setLoading(false)
    }
  }

  const handleUnenroll = async () => {
    if (!confirm('Are you sure you want to unenroll from this course?')) {
      return
    }

    setLoading(true)
    try {
      const { data } = await api.delete(`/enrollments/${course._id}`)
      toast.success(data.message || 'Successfully unenrolled from course')
      await fetchEnrollmentStatus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unenroll from course')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!confirm('Mark this course as completed?')) {
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post(`/enrollments/${course._id}/complete`)
      toast.success(data.message || 'Course marked as completed!')
      await fetchEnrollmentStatus()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark course as complete')
    } finally {
      setLoading(false)
    }
  }

  const getEnrollmentButton = () => {
    if (!user || !showEnrollmentStatus) return null

    if (!enrollmentStatus?.enrolled) {
      return (
        <button
          onClick={handleEnroll}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Enrolling...' : 'Enroll Now'}
        </button>
      )
    }

    if (enrollmentStatus.isCompleted) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-center text-green-600 bg-green-50 p-2 rounded-lg">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Completed</span>
          </div>
          <Link
            to={`/courses/${course._id}/learn`}
            className="btn btn-secondary w-full"
          >
            Review Course
          </Link>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress: {enrollmentStatus.completionPercentage || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${enrollmentStatus.completionPercentage || 0}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/courses/${course._id}/learn`}
            className="btn btn-primary text-sm"
          >
            Continue
          </Link>
          <button
            onClick={handleMarkComplete}
            disabled={loading}
            className="btn btn-success text-sm"
          >
            {loading ? '...' : 'Complete'}
          </button>
        </div>
        <button
          onClick={handleUnenroll}
          disabled={loading}
          className="btn btn-outline text-sm w-full"
        >
          {loading ? 'Unenrolling...' : 'Unenroll'}
        </button>
      </div>
    )
  }

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      {/* Course Thumbnail */}
      <div className="relative">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-48 object-cover rounded-t-lg"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
        ) : null}
        <div
          className={`w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center ${
            course.thumbnail ? 'hidden' : 'block'
          }`}
        >
          <BookOpen className="h-16 w-16 text-white opacity-50" />
        </div>
        
        {/* Course Level Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            course.level === 'beginner' ? 'bg-green-100 text-green-800' :
            course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
          </span>
        </div>

        {/* Premium Badge */}
        {course.isPremium && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Premium
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Course Title */}
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
          <Link
            to={`/courses/${course._id}`}
            className="hover:text-blue-600 transition-colors"
          >
            {course.title}
          </Link>
        </h3>

        {/* Course Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.description}
        </p>

        {/* Instructor */}
        <div className="flex items-center mb-4">
          <img
            src={course.instructor?.profilePicture || '/default-avatar.png'}
            alt={course.instructor?.name}
            className="w-8 h-8 rounded-full mr-2"
          />
          <span className="text-sm text-gray-700">{course.instructor?.name}</span>
        </div>

        {/* Course Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span>{course.averageRating?.toFixed(1) || '0.0'}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{course.enrolledCount || 0}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.totalDuration || 0}min</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {course.price > 0 ? (
              <span className="text-2xl font-bold text-green-600">
                ${course.price}
              </span>
            ) : (
              <span className="text-2xl font-bold text-green-600">Free</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {course.category}
          </div>
        </div>

        {/* Enrollment Actions */}
        {getEnrollmentButton()}
      </div>
    </div>
  )
}

export default CourseCard
