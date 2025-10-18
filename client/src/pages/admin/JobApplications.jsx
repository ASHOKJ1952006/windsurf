import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ExternalLink,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const JobApplications = () => {
  const { user } = useSelector((state) => state.auth)
  const [applications, setApplications] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([])
  const [filters, setFilters] = useState({
    status: 'all',
    jobId: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({})
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [jobs, setJobs] = useState([])
  const [statusUpdate, setStatusUpdate] = useState({ status: '', note: '' })
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchApplications()
    fetchJobs()
  }, [filters])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key])
        }
      })

      const { data } = await api.get(`/job-applications/admin/all?${params}`)
      setApplications(data.applications || [])
      setPagination(data.pagination || {})
      setStats(data.stats || [])
    } catch (error) {
      console.error('Fetch applications error:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/jobs')
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Fetch jobs error:', error)
    }
  }

  const fetchApplicationDetails = async (applicationId) => {
    try {
      const { data } = await api.get(`/job-applications/admin/${applicationId}`)
      setSelectedApplication(data.application)
      setStatusUpdate({ 
        status: data.application.status, 
        note: '' 
      })
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Fetch application details error:', error)
      toast.error('Failed to load application details')
    }
  }

  const updateApplicationStatus = async () => {
    try {
      setUpdatingStatus(true)
      const { data } = await api.put(
        `/job-applications/admin/${selectedApplication._id}/status`,
        statusUpdate
      )
      
      if (data.success) {
        toast.success('Application status updated successfully')
        setSelectedApplication(data.application)
        fetchApplications() // Refresh the list
      }
    } catch (error) {
      console.error('Update status error:', error)
      toast.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      reviewing: <Eye className="h-4 w-4" />,
      shortlisted: <CheckCircle className="h-4 w-4" />,
      interviewed: <MessageSquare className="h-4 w-4" />,
      hired: <CheckCircle className="h-4 w-4" />,
      rejected: <XCircle className="h-4 w-4" />
    }
    return icons[status] || <AlertCircle className="h-4 w-4" />
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const getStatsValue = (status) => {
    const stat = stats.find(s => s._id === status)
    return stat ? stat.count : 0
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Job Applications</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and review job applications from students
        </p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-6 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">{applications.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{getStatsValue('pending')}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{getStatsValue('reviewing')}</div>
          <div className="text-sm text-gray-500">Reviewing</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">{getStatsValue('shortlisted')}</div>
          <div className="text-sm text-gray-500">Shortlisted</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{getStatsValue('hired')}</div>
          <div className="text-sm text-gray-500">Hired</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{getStatsValue('rejected')}</div>
          <div className="text-sm text-gray-500">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Filters:</span>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interviewed">Interviewed</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.jobId}
            onChange={(e) => handleFilterChange('jobId', e.target.value)}
            className="input w-auto"
          >
            <option value="">All Jobs</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.title} - {job.company}
              </option>
            ))}
          </select>

          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="input w-auto"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading applications...</p>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Users className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold">
                      {application.personalInfo?.fullName || application.applicant?.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span className="capitalize">{application.status}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {application.job?.title} at {application.job?.company}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {application.personalInfo?.email}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {application.personalInfo?.phone && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <Phone className="h-4 w-4 mr-1" />
                      {application.personalInfo.phone}
                    </div>
                  )}

                  {application.personalInfo?.location && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      {application.personalInfo.location}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => fetchApplicationDetails(application._id)}
                    className="btn-outline flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No applications found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No job applications match your current filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * filters.limit, pagination.totalApplications)} of{' '}
            {pagination.totalApplications} applications
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedApplication.personalInfo?.fullName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Applied for {selectedApplication.job?.title} at {selectedApplication.job?.company}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Application Details */}
                <div className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {selectedApplication.personalInfo?.email}
                      </div>
                      {selectedApplication.personalInfo?.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedApplication.personalInfo.phone}
                        </div>
                      )}
                      {selectedApplication.personalInfo?.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedApplication.personalInfo.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Experience */}
                  {selectedApplication.experience && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Experience</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {selectedApplication.experience}
                      </p>
                    </div>
                  )}

                  {/* Education */}
                  {selectedApplication.education && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Education</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {selectedApplication.education}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cover Letter */}
                  {selectedApplication.coverLetter && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column - Actions & Status */}
                <div className="space-y-6">
                  {/* Current Status */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Application Status</h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 w-fit ${getStatusColor(selectedApplication.status)}`}>
                      {getStatusIcon(selectedApplication.status)}
                      <span className="capitalize">{selectedApplication.status}</span>
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Applied on {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Update Status */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Update Status</h3>
                    <div className="space-y-3">
                      <select
                        value={statusUpdate.status}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                        className="input"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      
                      <textarea
                        value={statusUpdate.note}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="Add a note about this status update..."
                        className="input min-h-[80px]"
                      />
                      
                      <button
                        onClick={updateApplicationStatus}
                        disabled={updatingStatus}
                        className="btn-primary w-full"
                      >
                        {updatingStatus ? 'Updating...' : 'Update Status'}
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Documents</h3>
                    <div className="space-y-2">
                      {selectedApplication.resumeUrl && (
                        <a
                          href={selectedApplication.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Resume
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                      {selectedApplication.portfolioUrl && (
                        <a
                          href={selectedApplication.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Portfolio
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {selectedApplication.adminNotes && selectedApplication.adminNotes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Admin Notes</h3>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {selectedApplication.adminNotes.map((note, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <p className="text-sm">{note.note}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              By {note.addedBy?.name} on {new Date(note.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobApplications
