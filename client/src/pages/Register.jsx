import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../store/slices/authSlice'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookOpen, Mail, Lock, User, UserCircle, ArrowRight, Sparkles } from 'lucide-react'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.auth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await dispatch(register(formData)).unwrap()
      toast.success('Registration successful!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main container */}
      <div className="relative max-w-5xl w-full">
        <div className="auth-container">
          {/* Left Panel - Welcome Section */}
          <div className="welcome-panel">
            <div className="welcome-content">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-10 w-10 text-white" />
                <span className="text-2xl font-bold text-white">E-Learn</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in-up">
                JOIN US TODAY!
              </h1>
              <p className="text-orange-100 text-lg mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Start your learning journey with us. Create an account and unlock endless possibilities!
              </p>
              <div className="flex items-center gap-2 text-orange-200 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <Sparkles className="h-5 w-5" />
                <span className="text-sm">Access thousands of courses</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Register Form */}
          <div className="form-panel">
            <div className="form-content">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 animate-fade-in-down">Register</h2>
                <p className="text-gray-400 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>Create your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="input-wrapper">
                    <User className="input-icon" />
                    <input
                      type="text"
                      required
                      className="auth-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      required
                      className="auth-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="auth-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    I am a...
                  </label>
                  <div className="input-wrapper">
                    <UserCircle className="input-icon" />
                    <select
                      className="auth-input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-button group"
                >
                  <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
