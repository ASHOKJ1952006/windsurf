import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Award, Download, Share2, Calendar, Trophy, ExternalLink, Eye, BookOpen, Plus } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Certificates = () => {
  const { user } = useSelector((state) => state.auth)
  const [certificates, setCertificates] = useState([])
  const [completedCourses, setCompletedCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCertificates()
    }
  }, [user])

  const fetchCertificates = async () => {
    try {
      // Fetch certificates
      const { data } = await api.get('/progress/certificates')
      setCertificates(data.certificates || [])
      
      // Fetch completed courses without certificates
      const enrollmentsRes = await api.get('/enrollments/my')
      const completedWithoutCerts = enrollmentsRes.data.enrollments?.filter(enrollment => 
        enrollment.isCompleted && 
        !data.certificates?.some(cert => cert.course._id === enrollment.course._id)
      ) || []
      
      setCompletedCourses(completedWithoutCerts)
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = async (certificateId) => {
    try {
      const { data } = await api.get(`/progress/certificate/${certificateId}/download`)
      
      if (data.success && data.downloadUrl) {
        // Create download link
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = `Certificate-${certificateId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Certificate downloaded successfully!')
      } else {
        toast.error('Failed to get download URL')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error(error.response?.data?.message || 'Failed to download certificate')
    }
  }

  const shareCertificate = (certificate) => {
    const courseName = certificate.courseName || certificate.course?.title || 'Course'
    const shareUrl = certificate.shareableUrl || `${window.location.origin}/certificates/verify/${certificate.verificationCode}`
    
    if (navigator.share) {
      navigator.share({
        title: `${courseName} Certificate`,
        text: `I've completed ${courseName} and earned a certificate!`,
        url: shareUrl
      }).catch(() => {
        // Fallback if sharing fails
        navigator.clipboard.writeText(shareUrl)
        toast.success('Certificate link copied to clipboard!')
      })
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(shareUrl)
      toast.success('Certificate link copied to clipboard!')
    }
  }

  const generateCertificate = async (courseId) => {
    try {
      const { data } = await api.post(`/progress/${courseId}/certificate`)
      
      if (data.success) {
        toast.success('Certificate generated successfully!')
        fetchCertificates() // Refresh the data
      } else {
        toast.error(data.message || 'Failed to generate certificate')
      }
    } catch (error) {
      console.error('Generate certificate error:', error)
      toast.error(error.response?.data?.message || 'Failed to generate certificate')
    }
  }

  const getGradeColor = (grade) => {
    if (grade && grade.startsWith('A')) return 'text-green-600 bg-green-100'
    if (grade && grade.startsWith('B')) return 'text-blue-600 bg-blue-100'
    if (grade && grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
          <h1 className="text-4xl font-bold">My Certificates</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Your earned certificates and achievements
        </p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{certificates.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Certificates</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {certificates.filter(c => c.grade && c.grade.startsWith('A')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">A Grades</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">
            {certificates.length > 0 ? Math.round(certificates.reduce((acc, cert) => acc + (cert.finalScore || 0), 0) / certificates.length) : 0}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600">
            {certificates.length > 0 ? Math.round(certificates.reduce((acc, cert) => acc + (cert.totalTimeSpent || 0), 0)) : 0}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Study Time</div>
        </div>
      </div>

      {/* Completed Courses Without Certificates */}
      {completedCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BookOpen className="h-6 w-6 text-blue-500 mr-2" />
            Generate Certificates
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You have completed these courses but haven't generated certificates yet.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedCourses.map((enrollment) => (
              <div key={enrollment._id} className="card border-dashed border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{enrollment.course.title}</h3>
                    <p className="text-sm text-gray-600">
                      Completed: {new Date(enrollment.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <button
                  onClick={() => generateCertificate(enrollment.course._id)}
                  className="w-full btn btn-outline border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Grid */}
      {certificates.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Award className="h-6 w-6 text-yellow-500 mr-2" />
            Your Certificates
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
            <div key={certificate._id} className="card hover:shadow-lg transition-shadow">
              {/* Certificate Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {certificate.courseName || certificate.course?.title || 'Course Title'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {certificate.instructorName || certificate.course?.instructor?.name || 'Instructor'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(certificate.grade || 'A')}`}>
                  {certificate.grade || 'A'}
                </span>
              </div>

              {/* Certificate Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Completed: {new Date(certificate.completedAt || certificate.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Trophy className="h-4 w-4 mr-2" />
                  Score: {certificate.finalScore || 100}%
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Award className="h-4 w-4 mr-2" />
                  Certificate ID: {certificate.certificateId}
                </div>
              </div>

              {/* Course Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Modules:</span>
                    <span className="ml-2 font-medium">{certificate.totalModules || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Study Time:</span>
                    <span className="ml-2 font-medium">{certificate.totalTimeSpent || 0}h</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadCertificate(certificate.certificateId)}
                  className="flex-1 btn btn-primary btn-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => shareCertificate(certificate)}
                  className="flex-1 btn btn-outline btn-sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
              </div>

              {/* Verification */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Verification: {certificate.verificationCode}</span>
                  <span>Downloads: {certificate.downloadCount || 0}</span>
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No certificates yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete courses and pass final tests to earn certificates
          </p>
          <Link to="/courses" className="btn btn-primary">
            Browse Courses
          </Link>
        </div>
      )}

      {/* Certificate Verification Info */}
      {certificates.length > 0 && (
        <div className="mt-12 card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Certificate Verification
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            All certificates can be verified using their unique verification codes. 
            Employers and institutions can verify the authenticity of your certificates.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Verification URL:</strong> {window.location.origin}/certificates/verify/[CODE]
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Certificates
