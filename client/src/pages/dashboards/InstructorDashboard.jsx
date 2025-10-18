import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Users, Star, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const InstructorDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    if (user?.id) {
      fetchMyCourses()
    }
  }, [user])

  const fetchMyCourses = async () => {
    try {
      if (!user?.id) {
        console.log('User ID not available, skipping course fetch')
        return
      }

      const { data } = await api.get('/courses', { params: { instructor: user.id } })
      setCourses(data.courses || [])
      
      // Calculate stats
      const totalStudents = data.courses?.reduce((sum, c) => sum + c.enrolledCount, 0) || 0
      const avgRating = data.courses?.length > 0
        ? data.courses.reduce((sum, c) => sum + c.averageRating, 0) / data.courses.length
        : 0

      setStats({
        totalCourses: data.courses?.length || 0,
        totalStudents,
        averageRating: avgRating,
        totalRevenue: 0
      })
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to fetch courses')
    }
  }

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return
    }

    try {
      await api.delete(`/courses/${courseId}`)
      toast.success('Course deleted successfully')
      fetchMyCourses() // Refresh the list
    } catch (error) {
      console.error('Failed to delete course:', error)
      toast.error('Failed to delete course')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Instructor Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your courses and students</p>
        </div>
        <Link to="/courses/create" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Courses</p>
              <p className="text-3xl font-bold">{stats.totalCourses}</p>
            </div>
            <BookOpen className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Students</p>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Rating</p>
              <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
            </div>
            <Star className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Revenue</p>
              <p className="text-3xl font-bold">${stats.totalRevenue}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* My Courses */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">My Courses</h2>
        {courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course._id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{course.enrolledCount} students</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        <span>{course.averageRating.toFixed(1)} ({course.totalRatings})</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        course.status === 'published' ? 'bg-green-100 text-green-800' :
                        course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status}
                      </span>
                      {course.isApproved ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button 
                      onClick={() => navigate(`/courses/edit/${course._id}`)}
                      className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900 rounded"
                      title="Edit Course"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => deleteCourse(course._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      title="Delete Course"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No courses created yet</p>
            <Link to="/courses/create" className="btn-primary">
              Create Your First Course
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstructorDashboard
