import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { Bell, BookOpen, Menu, User, LogOut, Home, Briefcase, MessageSquare, Users, TrendingUp, Award, Folder } from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { unreadCount } = useSelector((state) => state.notifications)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900/95 backdrop-blur-xl shadow-2xl sticky top-0 z-50 border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <BookOpen className="h-8 w-8 text-orange-500 group-hover:text-orange-400 transition-colors" />
                <div className="absolute inset-0 bg-orange-500/20 blur-xl group-hover:bg-orange-400/30 transition-all"></div>
              </div>
              <span className="text-xl font-bold text-white">E-Learn</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex ml-10 space-x-1 items-center">
              <Link to="/" className="nav-link group">
                <Home className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                Home
              </Link>
              {user?.role === 'student' && (
                <Link to="/courses" className="nav-link group">
                  <BookOpen className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                  Courses
                </Link>
              )}
              <Link to="/forum" className="nav-link group">
                <MessageSquare className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                Forum
              </Link>
              {user?.role === 'student' && (
                <Link to="/jobs" className="nav-link group">
                  <Briefcase className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                  Jobs
                </Link>
              )}
              {isAuthenticated && (
                <>
                  {user?.role === 'student' && (
                    <Link to="/recommendations" className="nav-link group">
                      <TrendingUp className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                      For You
                    </Link>
                  )}
                  {user?.role !== 'admin' && (
                    <Link to="/mentorships" className="nav-link group">
                      <Users className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                      Mentorship
                    </Link>
                  )}
                  {user?.role !== 'admin' && (
                    <Link to="/portfolio" className="nav-link group">
                      <Folder className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                      Portfolio
                    </Link>
                  )}
                  {user?.role === 'student' && (
                    <Link to="/certificates" className="nav-link group">
                      <Award className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                      Certificates
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <button className="relative p-2 text-gray-300 hover:text-orange-400 transition-colors group">
                  <Bell className="h-6 w-6 group-hover:animate-pulse" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg shadow-orange-500/50">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <Link to="/dashboard" className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300">
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2">
                  <Link to={`/profile/${user?.id}`} className="group">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold shadow-lg group-hover:shadow-orange-500/50 transform group-hover:scale-110 transition-all duration-300">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-300 hover:text-red-400 transition-colors group">
                    <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-white hover:text-orange-400 font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300">
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1 bg-gray-800/50 rounded-lg mt-2 p-2 backdrop-blur-sm border border-gray-700/50">
            <Link to="/" className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-gray-700/50 rounded-lg transition-all">Home</Link>
            {user?.role === 'student' && (
              <Link to="/courses" className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-gray-700/50 rounded-lg transition-all">Courses</Link>
            )}
            <Link to="/forum" className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-gray-700/50 rounded-lg transition-all">Forum</Link>
            {user?.role === 'student' && (
              <Link to="/jobs" className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-gray-700/50 rounded-lg transition-all">Jobs</Link>
            )}
            {isAuthenticated && (
              <>
                {user?.role !== 'admin' && (
                  <Link to="/mentorships" className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-gray-700/50 rounded-lg transition-all">Mentorship</Link>
                )}
                <Link to="/dashboard" className="block px-3 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all">Dashboard</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
