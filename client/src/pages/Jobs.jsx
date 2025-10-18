import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchJobs } from '../store/slices/jobsSlice'
import { Briefcase, MapPin, DollarSign, Clock, ExternalLink, FileText, MessageSquare, ArrowRight, User, Mail, Phone, MapPin as LocationIcon, Upload, Link as LinkIcon, X, Calendar } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

const Jobs = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { jobs, loading } = useSelector((state) => state.jobs)
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [applicationData, setApplicationData] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: ''
    },
    experience: '',
    education: '',
    skills: [],
    resumeUrl: '',
    portfolioUrl: '',
    coverLetter: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [userApplications, setUserApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(false)

  useEffect(() => {
    dispatch(fetchJobs())
    if (isAuthenticated && user?.role === 'student') {
      fetchUserApplications()
    }
  }, [dispatch, isAuthenticated, user])

  // Socket.IO for real-time notifications
  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000')
      
      // Join user room for notifications
      socket.emit('join-user-room', user.id)
      
      // Listen for job application notifications
      socket.on('notification', (notification) => {
        if (notification.type === 'job_application') {
          toast.success(notification.message)
          fetchUserApplications() // Refresh applications
        }
      })

      return () => {
        socket.disconnect()
      }
    }
  }, [isAuthenticated, user])

  const fetchUserApplications = async () => {
    try {
      setLoadingApplications(true)
      const { data } = await api.get('/job-applications/my')
      setUserApplications(data.applications || [])
    } catch (error) {
      console.error('Fetch applications error:', error)
    } finally {
      setLoadingApplications(false)
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      'full-time': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'part-time': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'contract': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'internship': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'remote': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getApplicationStatus = (jobId) => {
    const application = userApplications.find(app => app.job?._id === jobId)
    return application ? application.status : null
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      interviewed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      hired: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleApplyClick = (job) => {
    if (!isAuthenticated) {
      toast.error('Please login to apply for jobs')
      navigate('/login')
      return
    }

    if (user?.role !== 'student') {
      toast.error('Only students can apply for jobs')
      return
    }

    setSelectedJob(job)
    setApplicationData({
      personalInfo: {
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        location: ''
      },
      experience: '',
      education: '',
      skills: [],
      resumeUrl: '',
      portfolioUrl: '',
      coverLetter: ''
    })
    setShowApplicationModal(true)
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setApplicationData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setApplicationData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSkillsChange = (skillsString) => {
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill)
    setApplicationData(prev => ({
      ...prev,
      skills: skillsArray
    }))
  }

  const submitApplication = async () => {
    try {
      setSubmitting(true)

      // Validation
      if (!applicationData.personalInfo.fullName || !applicationData.personalInfo.email || 
          !applicationData.personalInfo.phone || !applicationData.resumeUrl) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await api.post(`/job-applications/apply/${selectedJob._id}`, applicationData)

      if (response.data.success) {
        toast.success('Application submitted successfully!')
        setShowApplicationModal(false)
        setSelectedJob(null)
        fetchUserApplications() // Refresh applications
      }
    } catch (error) {
      console.error('Application error:', error)
      toast.error(error.response?.data?.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Career Center</h1>

      {/* My Applications Section for Students */}
      {isAuthenticated && user?.role === 'student' && userApplications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileText className="h-6 w-6 text-primary-600 mr-2" />
            My Job Applications
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userApplications.slice(0, 6).map((application) => (
              <div key={application._id} className="card border-l-4 border-l-primary-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{application.job?.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{application.job?.company}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Applied: {new Date(application.appliedAt).toLocaleDateString()}
                  </div>
                  {application.updatedAt !== application.appliedAt && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Updated: {new Date(application.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {userApplications.length > 6 && (
            <div className="text-center mt-4">
              <button className="btn-outline">
                View All Applications ({userApplications.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Career Tools */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div 
          onClick={() => navigate('/resume-builder')}
          className="card hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-primary-600"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">Resume Builder</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create ATS-friendly, professional resumes with AI-powered suggestions and multiple export formats
              </p>
              <div className="flex items-center text-primary-600 font-medium">
                Build Your Resume
                <ArrowRight className="h-5 w-5 ml-2" />
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/interview-prep')}
          className="card hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-primary-600"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">Interview Preparation</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Practice with AI-powered mock interviews, get instant feedback, and track your improvement
              </p>
              <div className="flex items-center text-green-600 font-medium">
                Start Practicing
                <ArrowRight className="h-5 w-5 ml-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Available Positions</h2>
        <p className="text-gray-600 dark:text-gray-400">Browse and apply to job opportunities</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading jobs...</div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Briefcase className="h-6 w-6 text-primary-600" />
                    <h3 className="text-2xl font-semibold">{job.title}</h3>
                  </div>
                  <div className="text-xl text-gray-700 dark:text-gray-300 mb-3">
                    {job.company}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    {job.salary && job.salary.min && job.salary.max && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}
                      </div>
                    )}
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(job.type)}`}>
                      {job.type}
                    </span>
                    {job.skills?.slice(0, 5).map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  {isAuthenticated && user?.role === 'student' && (
                    <>
                      {getApplicationStatus(job._id) ? (
                        <div className="flex flex-col space-y-2">
                          <span className={`px-4 py-2 rounded-full text-sm font-medium text-center ${getStatusColor(getApplicationStatus(job._id))}`}>
                            {getApplicationStatus(job._id).charAt(0).toUpperCase() + getApplicationStatus(job._id).slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 text-center">Application Status</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplyClick(job)}
                          className="btn-primary flex items-center"
                        >
                          Apply Now
                          <User className="h-4 w-4 ml-2" />
                        </button>
                      )}
                    </>
                  )}
                  {(!isAuthenticated || user?.role !== 'student') && (
                    <button
                      onClick={() => handleApplyClick(job)}
                      className="btn-primary flex items-center"
                    >
                      Apply Now
                      <User className="h-4 w-4 ml-2" />
                    </button>
                  )}
                  {job.applyUrl && (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline flex items-center text-sm"
                    >
                      External Link
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No jobs available at the moment. Check back later!
        </div>
      )}

      {/* Job Application Modal */}
      {showApplicationModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Apply for {selectedJob.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{selectedJob.company}</p>
                </div>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Application Form */}
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={applicationData.personalInfo.fullName}
                        onChange={(e) => handleInputChange('personalInfo.fullName', e.target.value)}
                        className="input"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        value={applicationData.personalInfo.email}
                        onChange={(e) => handleInputChange('personalInfo.email', e.target.value)}
                        className="input"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={applicationData.personalInfo.phone}
                        onChange={(e) => handleInputChange('personalInfo.phone', e.target.value)}
                        className="input"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <input
                        type="text"
                        value={applicationData.personalInfo.location}
                        onChange={(e) => handleInputChange('personalInfo.location', e.target.value)}
                        className="input"
                        placeholder="City, State/Country"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Professional Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Work Experience</label>
                      <textarea
                        value={applicationData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        className="input min-h-[100px]"
                        placeholder="Describe your relevant work experience..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Education</label>
                      <textarea
                        value={applicationData.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        className="input min-h-[80px]"
                        placeholder="Your educational background..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Skills</label>
                      <input
                        type="text"
                        onChange={(e) => handleSkillsChange(e.target.value)}
                        className="input"
                        placeholder="JavaScript, React, Node.js, Python (comma-separated)"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents & Links */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documents & Links
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Resume URL *</label>
                      <input
                        type="url"
                        value={applicationData.resumeUrl}
                        onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                        className="input"
                        placeholder="https://drive.google.com/your-resume"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload your resume to Google Drive, Dropbox, or similar and paste the public link</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Portfolio URL</label>
                      <input
                        type="url"
                        value={applicationData.portfolioUrl}
                        onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                        className="input"
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Cover Letter</label>
                      <textarea
                        value={applicationData.coverLetter}
                        onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                        className="input min-h-[120px]"
                        placeholder="Write a brief cover letter explaining why you're interested in this position..."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitApplication}
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Jobs
