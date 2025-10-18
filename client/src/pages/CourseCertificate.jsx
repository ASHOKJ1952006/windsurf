import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Award, Download, Share2, ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const CourseCertificate = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

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
      
      // Fetch progress
      const progressRes = await api.get(`/progress/${courseId}`)
      setProgress(progressRes.data.progress)
      
      // Check if certificate already exists
      if (progressRes.data.progress.certificateUrl || progressRes.data.progress.certificateId) {
        // Try to fetch the actual certificate from the database
        try {
          const certRes = await api.get('/progress/certificates')
          const courseCertificate = certRes.data.certificates.find(cert => cert.course._id === courseId)
          if (courseCertificate) {
            setCertificate(courseCertificate)
          } else {
            // Fallback to progress data
            setCertificate({
              url: progressRes.data.progress.certificateUrl,
              generatedAt: progressRes.data.progress.certificateGeneratedAt,
              certificateId: progressRes.data.progress.certificateId
            })
          }
        } catch (error) {
          console.error('Error fetching certificate:', error)
          // Fallback to progress data
          setCertificate({
            url: progressRes.data.progress.certificateUrl,
            generatedAt: progressRes.data.progress.certificateGeneratedAt,
            certificateId: progressRes.data.progress.certificateId
          })
        }
      }
      
    } catch (error) {
      console.error('Error fetching course data:', error)
      toast.error('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  const generateCertificate = async () => {
    try {
      setGenerating(true)
      
      const response = await api.post(`/progress/${courseId}/certificate`)
      
      if (response.data.success) {
        setCertificate(response.data.certificate)
        toast.success('Certificate generated successfully!')
      } else {
        toast.error(response.data.message || 'Failed to generate certificate')
      }
      
    } catch (error) {
      console.error('Error generating certificate:', error)
      toast.error(error.response?.data?.message || 'Failed to generate certificate')
    } finally {
      setGenerating(false)
    }
  }

  const downloadCertificate = async () => {
    if (certificate?.shareableUrl || certificate?.url) {
      try {
        // If we have a certificate ID, use the download endpoint
        if (certificate.certificateId) {
          const response = await api.get(`/progress/certificate/${certificate.certificateId}/download`)
          if (response.data.downloadUrl) {
            const link = document.createElement('a')
            link.href = response.data.downloadUrl
            link.download = `${course.title}-Certificate.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            return
          }
        }
        
        // Fallback to direct URL
        const link = document.createElement('a')
        link.href = certificate.shareableUrl || certificate.url
        link.download = `${course.title}-Certificate.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.error('Download error:', error)
        toast.error('Failed to download certificate')
      }
    }
  }

  const shareCertificate = async () => {
    if (navigator.share && certificate?.url) {
      try {
        await navigator.share({
          title: `${course.title} - Course Completion Certificate`,
          text: `I just completed the course "${course.title}"!`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Certificate URL copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!course || !progress) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <button onClick={() => navigate('/courses')} className="btn btn-primary">
          Back to Courses
        </button>
      </div>
    )
  }

  if (!progress.isCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold mb-4">Course Not Completed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to complete all modules and pass all tests to earn your certificate.
          </p>
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">Progress: {progress.overallProgress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full"
                style={{ width: `${progress.overallProgress}%` }}
              ></div>
            </div>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => navigate(`/courses/${courseId}/learn`)}
              className="btn btn-primary"
            >
              Continue Learning
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Course Certificate</h1>
            <p className="text-gray-600 dark:text-gray-400">{course.title}</p>
          </div>
        </div>
      </div>

      {/* Congratulations Section */}
      <div className="text-center mb-8">
        <div className="text-8xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold mb-4 text-green-600">Congratulations!</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          You have successfully completed the course
        </p>
        <h3 className="text-2xl font-semibold mb-4">{course.title}</h3>
        
        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {course.modules?.length || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Modules Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {progress.overallProgress}%
            </div>
            <div className="text-gray-600 dark:text-gray-400">Course Progress</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.round(progress.totalTimeSpent / 60) || 0}h
            </div>
            <div className="text-gray-600 dark:text-gray-400">Time Invested</div>
          </div>
        </div>
      </div>

      {/* Certificate Section */}
      <div className="card text-center">
        <div className="flex items-center justify-center mb-6">
          <Award className="h-12 w-12 text-yellow-500 mr-3" />
          <h3 className="text-2xl font-semibold">Your Certificate</h3>
        </div>
        
        {certificate ? (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your certificate has been generated and is ready for download.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={downloadCertificate}
                className="btn btn-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Certificate
              </button>
              <button
                onClick={shareCertificate}
                className="btn btn-outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Achievement
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Generated on {new Date(certificate.generatedAt || certificate.createdAt).toLocaleDateString()}
            </p>
            {certificate.certificateId && (
              <p className="text-xs text-gray-400 mt-2">
                Certificate ID: {certificate.certificateId}
              </p>
            )}
            {certificate.verificationCode && (
              <p className="text-xs text-gray-400">
                Verification Code: {certificate.verificationCode}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate your official course completion certificate.
            </p>
            <button
              onClick={generateCertificate}
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Generate Certificate
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="card mt-8">
        <h3 className="text-xl font-semibold mb-4">What's Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Explore More Courses</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Continue your learning journey with our other courses.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="btn btn-outline btn-sm"
            >
              Browse Courses
            </button>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Share Your Success</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Let others know about your achievement on social media.
            </p>
            <button
              onClick={shareCertificate}
              className="btn btn-outline btn-sm"
            >
              Share Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseCertificate
