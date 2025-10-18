import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './store/slices/authSlice'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import StudentDashboard from './pages/dashboards/StudentDashboard'
import InstructorDashboard from './pages/dashboards/InstructorDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import Forum from './pages/Forum'
import Jobs from './pages/Jobs'
import Mentorships from './pages/Mentorships'
import Profile from './pages/Profile'
import Recommendations from './pages/Recommendations'
import LearnCourse from './pages/LearnCourse'
import CourseCertificate from './pages/CourseCertificate'
import Certificates from './pages/Certificates'
import CreateCourse from './pages/CreateCourse'
import EditCourse from './pages/EditCourse'
import ResumeBuilder from './pages/ResumeBuilder'
import InterviewPrep from './pages/InterviewPrep'
import AuthTest from './pages/AuthTest'
import Portfolio from './pages/Portfolio'
import PublicPortfolio from './pages/PublicPortfolio'
import PortfolioEditor from './pages/PortfolioEditor'
import PortfolioAnalytics from './pages/PortfolioAnalytics'
import PortfolioDebug from './pages/PortfolioDebug'
import JobApplications from './pages/admin/JobApplications'

// Components
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Loading from './components/Loading'
import ErrorBoundary from './pages/ErrorBoundary'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      dispatch(checkAuth())
    }
  }, [dispatch])

  if (loading) {
    return <Loading />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <Navbar />
        
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:courseId/learn" element={<ProtectedRoute><LearnCourse /></ProtectedRoute>} />
        <Route path="/courses/:courseId/certificate" element={<ProtectedRoute><CourseCertificate /></ProtectedRoute>} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {user?.role === 'student' && <StudentDashboard />}
            {user?.role === 'instructor' && <InstructorDashboard />}
            {user?.role === 'admin' && <AdminDashboard />}
          </ProtectedRoute>
        } />
        <Route path="/mentorships" element={<ProtectedRoute><Mentorships /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
        <Route path="/courses/create" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
        <Route path="/courses/edit/:id" element={<ProtectedRoute><EditCourse /></ProtectedRoute>} />
        <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
        <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
        <Route path="/auth-test" element={<ProtectedRoute><AuthTest /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Portfolio routes */}
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/portfolio/:slug" element={<PublicPortfolio />} />
        <Route path="/portfolio/editor" element={<ProtectedRoute><PortfolioEditor /></ProtectedRoute>} />
        <Route path="/portfolio/analytics" element={<ProtectedRoute><PortfolioAnalytics /></ProtectedRoute>} />
        <Route path="/portfolio/debug" element={<ProtectedRoute><PortfolioDebug /></ProtectedRoute>} />
        
        {/* Admin routes */}
        <Route path="/admin/job-applications" element={<ProtectedRoute><JobApplications /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
    </ErrorBoundary>
  )
}

export default App
