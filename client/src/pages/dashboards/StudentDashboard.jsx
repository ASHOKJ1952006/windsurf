import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyEnrollments, unenrollCourse } from '../../store/slices/enrollmentsSlice'
import { fetchRecommendations } from '../../store/slices/coursesSlice'
import { Link } from 'react-router-dom'
import { BookOpen, Award, TrendingUp, Target, Trophy, BarChart3, Play, CheckCircle, Bot, MessageSquare, Briefcase, Star, Clock, X, AlertTriangle, Zap, Users } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

const StudentDashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { enrollments } = useSelector((state) => state.enrollments)
  const { recommendations } = useSelector((state) => state.courses)
  const [chatMessage, setChatMessage] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [certificates, setCertificates] = useState([])
  const [courseStats, setCourseStats] = useState(null)
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false)
  const [courseToUnenroll, setCourseToUnenroll] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    dispatch(fetchMyEnrollments())
    dispatch(fetchRecommendations())
    fetchCertificates()
    fetchCourseStats()

    // Initialize Socket.IO for real-time updates
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000')
    setSocket(newSocket)

    // Join user's personal room
    if (user?._id) {
      newSocket.emit('join', `user_${user._id}`)
    }

    // Listen for course stats updates
    newSocket.on('courseStatsUpdate', (stats) => {
      setCourseStats(stats)
    })

    // Listen for course completion
    newSocket.on('courseCompleted', () => {
      toast.success('🎉 Course completed! Congratulations!')
      dispatch(fetchMyEnrollments())
      fetchCourseStats()
      fetchCertificates()
    })

    // Cleanup on unmount
    return () => {
      newSocket.close()
    }
  }, [dispatch, user?._id])

  const fetchCourseStats = async () => {
    try {
      setStatsLoading(true)
      const { data } = await api.get('/enrollments/stats')
      setCourseStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch course stats:', error)
      toast.error('Failed to load statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchCertificates = async () => {
    try {
      const { data } = await api.get('/progress/certificates')
      setCertificates(data.certificates)
    } catch (error) {
      console.error('Failed to fetch certificates')
    }
  }

  const handleChatbot = async (e) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    try {
      const { data } = await api.post('/chatbot/chat', { message: chatMessage })
      setChatResponse(data.response)
      setChatMessage('')
    } catch (error) {
      toast.error('Chatbot error')
    }
  }

  const handleUnenrollClick = (enrollment) => {
    setCourseToUnenroll(enrollment)
    setShowUnenrollDialog(true)
  }

  const handleUnenrollConfirm = async () => {
    if (!courseToUnenroll) return

    try {
      await dispatch(unenrollCourse(courseToUnenroll.course._id)).unwrap()
      toast.success('Successfully unenrolled from course')
      // Refresh both enrollments and stats
      await dispatch(fetchMyEnrollments())
      await fetchCourseStats()
    } catch (error) {
      console.error('Error unenrolling:', error)
      toast.error(error.message || 'Failed to unenroll from course')
    } finally {
      setShowUnenrollDialog(false)
      setCourseToUnenroll(null)
    }
  }

  const handleUnenrollCancel = () => {
    setShowUnenrollDialog(false)
    setCourseToUnenroll(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-300 text-lg">Continue your learning journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="dashboard-stat-card group" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Enrolled Courses</p>
                {statsLoading ? (
                  <div className="h-9 w-12 bg-gray-700/50 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">{courseStats?.enrolledCourses || 0}</p>
                )}
              </div>
              <div className="stat-icon-wrapper bg-blue-500/20 border-blue-500/30">
                <BookOpen className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="dashboard-stat-card group" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Completed</p>
                {statsLoading ? (
                  <div className="h-9 w-12 bg-gray-700/50 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">{courseStats?.completedCourses || 0}</p>
                )}
              </div>
              <div className="stat-icon-wrapper bg-green-500/20 border-green-500/30">
                <Trophy className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
          <div className="dashboard-stat-card group" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">In Progress</p>
                {statsLoading ? (
                  <div className="h-9 w-12 bg-gray-700/50 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">{courseStats?.inProgressCourses || 0}</p>
                )}
              </div>
              <div className="stat-icon-wrapper bg-orange-500/20 border-orange-500/30">
                <Target className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>
          <div className="dashboard-stat-card group" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">XP Points</p>
                {statsLoading ? (
                  <div className="h-9 w-16 bg-gray-700/50 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">{courseStats?.xp || 0}</p>
                )}
              </div>
              <div className="stat-icon-wrapper bg-purple-500/20 border-purple-500/30">
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="dashboard-stat-card group" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Avg Progress</p>
                {statsLoading ? (
                  <div className="h-9 w-16 bg-gray-700/50 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">{courseStats?.averageProgress || 0}%</p>
                )}
              </div>
              <div className="stat-icon-wrapper bg-indigo-500/20 border-indigo-500/30">
                <BarChart3 className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        {courseStats && courseStats.enrolledCourses > 0 && (
          <div className="dashboard-card mb-8 bg-gradient-to-br from-orange-500/10 to-purple-500/10 border-2 border-orange-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Learning Progress</h2>
                <p className="text-sm text-gray-300">Keep up the great work!</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-700/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-300">Overall Progress</span>
                  <span className="text-2xl font-bold text-orange-400">
                    {Math.max(0, Math.min(100, courseStats.averageProgress || 0))}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 via-orange-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${Math.max(0, Math.min(100, courseStats.averageProgress || 0))}%`,
                      transitionProperty: 'width',
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 backdrop-blur-sm hover:border-green-500/50 transition-all">
                  <Trophy className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-400">{courseStats.completedCourses}</div>
                  <div className="text-sm font-medium text-green-300">Courses Completed</div>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                  <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-400">{courseStats.inProgressCourses}</div>
                  <div className="text-sm font-medium text-blue-300">In Progress</div>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 backdrop-blur-sm hover:border-purple-500/50 transition-all">
                  <Clock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-purple-400">{Math.floor((courseStats.totalLearningTime || 0) / 60)}h</div>
                  <div className="text-sm font-medium text-purple-300">Learning Time</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements & Badges */}
        {courseStats?.badges && courseStats.badges.length > 0 && (
          <div className="dashboard-card mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">Recent Achievements</h2>
          <div className="flex flex-wrap gap-3">
            {courseStats.badges.slice(0, 6).map((badge, index) => (
              <div key={index} className="flex items-center bg-yellow-50 text-yellow-800 px-3 py-2 rounded-full">
                <span className="text-lg mr-2">{badge.icon}</span>
                <span className="text-sm font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* Certificates Overview */}
        <div className="dashboard-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Certificates</h2>
            <Link to="/certificates" className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">
              View All
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates?.slice(0, 3).map((cert) => (
              <div key={cert._id} className="flex items-center justify-between p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl backdrop-blur-sm hover:border-yellow-500/50 transition-all">
                <div>
                  <h3 className="font-medium text-white">{cert.course?.title}</h3>
                  <p className="text-sm text-gray-300">
                    Completed on {new Date(cert.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-lg shadow-lg transition-all"
                >
                  Download
                </a>
              </div>
            ))}
            {(!certificates || certificates.length === 0) && (
              <div className="col-span-full text-center py-8 text-gray-400">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No certificates earned yet</p>
                <p className="text-sm">Complete courses to earn certificates!</p>
              </div>
            )}
          </div>
        </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Link to="/courses" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Browse Courses</h3>
              <p className="text-sm text-gray-600">Discover new skills</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </Link>
        <Link to="/mentorships" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Find Mentors</h3>
              <p className="text-sm text-gray-600">Get guidance</p>
            </div>
            <Award className="h-8 w-8 text-purple-600" />
          </div>
        </Link>
        <Link to="/jobs" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Job Board</h3>
              <p className="text-sm text-gray-600">Find opportunities</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </Link>
        <Link to="/interviews" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Practice</h3>
              <p className="text-sm text-gray-600">Interview prep</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Courses & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Continue Learning</h2>
              <Link to="/courses" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Courses
              </Link>
            </div>
            {enrollments && enrollments.filter(e => !e.isCompleted && e.status === 'active').length > 0 ? (
              <div className="space-y-4">
                {enrollments
                  .filter(e => !e.isCompleted && e.status === 'active')
                  .slice(0, 3)
                  .map((enrollment) => (
                  <div key={enrollment._id} className="group border dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-850">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {enrollment.course?.title || 'Untitled Course'}
                        </h3>
                        {enrollment.course?.instructor && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {enrollment.course.instructor.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {enrollment.completionPercentage || 0}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">complete</div>
                        </div>
                        <button
                          onClick={() => handleUnenrollClick(enrollment)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          title="Unenroll from course"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.max(0, Math.min(100, enrollment.completionPercentage || 0))}%`,
                          transitionProperty: 'width',
                          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                          transitionDuration: '1000ms'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                        <span className="text-[10px] font-bold text-white drop-shadow-sm">
                          {Math.round(enrollment.completionPercentage || 0)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Course Modules Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {enrollment.course?.modules && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{enrollment.course.modules.length} modules</span>
                          </div>
                        )}
                        {enrollment.course?.level && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                            {enrollment.course.level}
                          </span>
                        )}
                      </div>
                      <Link 
                        to={`/courses/${enrollment.course._id}/learn`}
                        className="btn btn-primary btn-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        {enrollment.completionPercentage === 0 ? (
                          <>
                            <Zap className="h-4 w-4" />
                            Start Course
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Continue
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-primary-100 dark:bg-primary-900/20 rounded-full animate-pulse"></div>
                  </div>
                  <BookOpen className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No Active Courses</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Start your learning journey today and unlock your potential!</p>
                <Link to="/courses" className="btn btn-primary inline-flex items-center gap-2 shadow-lg">
                  <Zap className="h-4 w-4" />
                  Explore Courses
                </Link>
              </div>
            )}
          </div>

          {/* Completed Courses */}
          {enrollments && enrollments.filter(e => e.isCompleted || e.status === 'completed').length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-semibold">Completed Courses</h2>
                </div>
                <Link to="/certificates" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  View Certificates
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {enrollments
                  .filter(e => e.isCompleted || e.status === 'completed')
                  .slice(0, 4)
                  .map((enrollment) => (
                  <div key={enrollment._id} className="relative border dark:border-gray-700 rounded-xl p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 text-white rounded-full p-2">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white pr-10 mb-2">
                      {enrollment.course?.title || 'Untitled Course'}
                    </h3>
                    {enrollment.course?.instructor && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        By {enrollment.course.instructor.name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Completed {new Date(enrollment.completedAt).toLocaleDateString()}
                      </span>
                      <Link 
                        to={`/courses/${enrollment.course._id}/certificate`}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <Award className="h-3 w-3" />
                        Certificate
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests & Recommendations */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recommended for You</h2>
              <Link to={`/profile/${user?._id}`} className="text-primary-600 hover:text-primary-700 text-sm">
                Manage Interests
              </Link>
            </div>
            
            {/* User Interests Display */}
            {user?.interests && user.interests.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Based on your interests:</p>
                <div className="flex flex-wrap gap-2">
                  {user.interests.slice(0, 5).map((interest, index) => (
                    <span key={index} className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                  {user.interests.length > 5 && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                      +{user.interests.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 4).map((course) => (
                    <Link key={course._id} to={`/courses/${course._id}`}>
                      <div className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold line-clamp-2 flex-1">{course.title}</h3>
                          {course.score && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {Math.round(course.score * 100)}% match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                        
                        {/* Match Reasons */}
                        {course.matchReasons && course.matchReasons.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Why this course?</p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {course.matchReasons[0]}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          {course.averageRating?.toFixed(1)}
                          <Clock className="h-4 w-4 ml-3 mr-1" />
                          {course.totalDuration}m
                          <span className="ml-3 text-xs">
                            {course.enrolledCount} students
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded">
                            {course.category}
                          </span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            {course.level}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Show more recommendations link */}
                <div className="text-center">
                  <Link 
                    to="/courses?recommended=true" 
                    className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-white hover:bg-primary-50 transition-colors"
                  >
                    View All Recommendations
                    <TrendingUp className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : user?.interests && user.interests.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add your interests to get personalized course recommendations
                </p>
                <Link to={`/profile/${user?._id}`} className="btn btn-primary">
                  Set Your Interests
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-gray-500 mt-4">Loading personalized recommendations...</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Chatbot Assistant */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Bot className="h-5 w-5 mr-2 text-primary-600" />
              AI Assistant
            </h3>
            <form onSubmit={handleChatbot} className="space-y-3">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="input"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary w-full">
                Ask
              </button>
            </form>
            {chatResponse && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                {chatResponse}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/forum" className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <MessageSquare className="h-5 w-5 mr-3 text-primary-600" />
                Community Forum
              </Link>
              <Link to="/jobs" className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <Briefcase className="h-5 w-5 mr-3 text-primary-600" />
                Job Board
              </Link>
              <Link to="/mentorships" className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <Award className="h-5 w-5 mr-3 text-primary-600" />
                Mentorship
              </Link>
            </div>
          </div>

          {/* Recent Certificates */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Certificates</h3>
              <Link to="/certificates" className="text-primary-600 hover:text-primary-700 text-sm">
                View All
              </Link>
            </div>
            {certificates && certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.slice(0, 2).map((certificate) => (
                  <div key={certificate._id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <Award className="h-6 w-6 text-yellow-500 mr-3" />
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">{certificate.courseName}</p>
                        <p className="text-xs text-gray-500">Grade: {certificate.grade}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No certificates yet. Complete courses to earn them!</p>
            )}
          </div>

          {/* Badges */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Badges</h3>
            {user?.badges && user.badges.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {user.badges.slice(0, 6).map((badge, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl mb-1">{badge.icon}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{badge.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No badges yet. Keep learning!</p>
            )}
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
              Are you sure you want to unenroll from "{courseToUnenroll?.course?.title}"? 
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
    </div>
  )
}

export default StudentDashboard
