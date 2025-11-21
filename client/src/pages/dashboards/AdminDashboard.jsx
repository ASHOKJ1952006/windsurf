import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Users, BookOpen, Briefcase, TrendingUp, CheckCircle, XCircle, Plus, X, Edit, Trash2, FileText } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth)
  const [adminMode, setAdminMode] = useState('')
  const [showModeDialog, setShowModeDialog] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalJobs: 0,
    totalApplications: 0,
    completionRate: 0
  })
  const [pendingCourses, setPendingCourses] = useState([])
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    description: '',
    requirements: [],
    skills: [],
    salary: { min: '', max: '', currency: 'USD' },
    applyUrl: '',
    companyLogo: '',
    expiresAt: ''
  })
  const [newRequirement, setNewRequirement] = useState('')
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated && user?.role === 'admin') {
      setShowModeDialog(true)
      fetchStats()
      fetchPendingCourses()
      fetchUsers()
      fetchJobs()
    }
  }, [isAuthenticated, authLoading, user?.role])

  const chooseMode = (mode) => {
    const normalized = mode === 'recruiter' ? 'recruiter' : 'web'
    setAdminMode(normalized)
    setShowModeDialog(false)
  }

  const fetchStats = async () => {
    try {
      if (!isAuthenticated || user?.role !== 'admin') return
      const { data } = await api.get('/admin/stats')
      setStats(data.stats)
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error('Failed to fetch stats')
      }
    }
  }

  const fetchPendingCourses = async () => {
    try {
      if (!isAuthenticated || user?.role !== 'admin') return
      const { data } = await api.get('/admin/courses', { params: { isApproved: false } })
      setPendingCourses(data.courses || [])
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error('Failed to fetch pending courses')
      }
    }
  }

  const fetchUsers = async () => {
    try {
      if (!isAuthenticated || user?.role !== 'admin') return
      const { data } = await api.get('/admin/users', { params: { limit: 10 } })
      setUsers(data.users || [])
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error('Failed to fetch users')
      }
    }
  }

  const approveCourse = async (courseId) => {
    try {
      await api.put(`/admin/courses/${courseId}/approve`)
      toast.success('Course approved!')
      fetchPendingCourses()
    } catch (error) {
      toast.error('Failed to approve course')
    }
  }

  const deleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    
    try {
      await api.delete(`/admin/courses/${courseId}`)
      toast.success('Course deleted!')
      fetchPendingCourses()
    } catch (error) {
      toast.error('Failed to delete course')
    }
  }

  const fetchJobs = async () => {
    try {
      if (!isAuthenticated) return
      const { data } = await api.get('/jobs', { params: { limit: 10 } })
      setJobs(data.jobs || [])
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error('Failed to fetch jobs')
      }
    }
  }

  const resetJobForm = () => {
    setJobForm({
      title: '',
      company: '',
      location: '',
      type: 'full-time',
      description: '',
      requirements: [],
      skills: [],
      salary: { min: '', max: '', currency: 'USD' },
      applyUrl: '',
      companyLogo: '',
      expiresAt: ''
    })
    setNewRequirement('')
    setNewSkill('')
    setEditingJob(null)
  }

  const openJobModal = (job = null) => {
    if (job) {
      setEditingJob(job)
      setJobForm({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        type: job.type || 'full-time',
        description: job.description || '',
        requirements: job.requirements || [],
        skills: job.skills || [],
        salary: {
          min: job.salary?.min || '',
          max: job.salary?.max || '',
          currency: job.salary?.currency || 'USD'
        },
        applyUrl: job.applyUrl || '',
        companyLogo: job.companyLogo || '',
        expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString().split('T')[0] : ''
      })
    } else {
      resetJobForm()
    }
    setShowJobModal(true)
  }

  const closeJobModal = () => {
    setShowJobModal(false)
    resetJobForm()
  }

  const handleJobFormChange = (field, value) => {
    if (field.startsWith('salary.')) {
      const salaryField = field.split('.')[1]
      setJobForm(prev => ({
        ...prev,
        salary: { ...prev.salary, [salaryField]: value }
      }))
    } else {
      setJobForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !jobForm.requirements.includes(newRequirement.trim())) {
      setJobForm(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (index) => {
    setJobForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !jobForm.skills.includes(newSkill.trim())) {
      setJobForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (index) => {
    setJobForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const handleJobSubmit = async (e) => {
    e.preventDefault()
    
    if (!jobForm.title || !jobForm.company || !jobForm.location || !jobForm.description || !jobForm.applyUrl) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const jobData = {
        ...jobForm,
        salary: {
          min: jobForm.salary.min ? parseFloat(jobForm.salary.min) : undefined,
          max: jobForm.salary.max ? parseFloat(jobForm.salary.max) : undefined,
          currency: jobForm.salary.currency
        },
        expiresAt: jobForm.expiresAt ? new Date(jobForm.expiresAt) : undefined
      }

      if (editingJob) {
        await api.put(`/jobs/${editingJob._id}`, jobData)
        toast.success('Job updated successfully!')
      } else {
        await api.post('/jobs', jobData)
        toast.success('Job created successfully!')
      }

      closeJobModal()
      fetchJobs()
      fetchStats() // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save job')
    }
  }

  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await api.delete(`/jobs/${jobId}`)
      toast.success('Job deleted successfully!')
      fetchJobs()
      fetchStats() // Refresh stats
    } catch (error) {
      toast.error('Failed to delete job')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showModeDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-semibold mb-2">Choose Admin Mode</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Select how you want to use the admin dashboard.</p>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => chooseMode('web')} className="btn btn-outline justify-between">
                <span className="font-medium">Web Admin</span>
                <span className="text-xs text-gray-500 ml-2">User management only</span>
              </button>
              <button onClick={() => chooseMode('recruiter')} className="btn btn-primary justify-between">
                <span className="font-medium">Recruiter</span>
                <span className="text-xs text-white/80 ml-2">Full access incl. jobs</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/admin/job-applications')}
            className="btn btn-outline flex items-center"
          >
            <FileText className="h-5 w-5 mr-2" />
            Job Applications
          </button>
          {adminMode === 'recruiter' && (
            <button
              onClick={() => openJobModal()}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Job
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-6 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <Users className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Courses</p>
              <p className="text-3xl font-bold">{stats.totalCourses}</p>
            </div>
            <BookOpen className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Enrollments</p>
              <p className="text-3xl font-bold">{stats.totalEnrollments}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Jobs Posted</p>
              <p className="text-3xl font-bold">{stats.totalJobs}</p>
            </div>
            <Briefcase className="h-10 w-10 text-purple-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Applications</p>
              <p className="text-3xl font-bold">{stats.totalApplications || 0}</p>
            </div>
            <FileText className="h-10 w-10 text-orange-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold">{stats.completionRate}%</p>
            </div>
            <TrendingUp className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Pending Courses */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Pending Course Approvals</h2>
          {pendingCourses.length > 0 ? (
            <div className="space-y-3">
              {pendingCourses.map((course) => (
                <div key={course._id} className="border dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    by {course.instructor?.name}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => approveCourse(course._id)}
                      className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => deleteCourse(course._id)}
                      className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No pending courses</p>
          )}
        </div>

        {/* Recent Users */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Recent Users</h2>
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between border dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No users found</p>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Recent Jobs</h2>
          {jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job._id} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{job.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{job.company}</p>
                      <p className="text-xs text-gray-500">{job.location} • {job.type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {job.applications?.length || 0} applications
                      </p>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => openJobModal(job)}
                        className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteJob(job._id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No jobs posted yet</p>
          )}
        </div>
      </div>

      {/* Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {editingJob ? 'Edit Job' : 'Add New Job'}
              </h2>
              <button
                onClick={closeJobModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleJobSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Job Title *</label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => handleJobFormChange('title', e.target.value)}
                    className="input w-full"
                    placeholder="e.g. Senior Frontend Developer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company *</label>
                  <input
                    type="text"
                    value={jobForm.company}
                    onChange={(e) => handleJobFormChange('company', e.target.value)}
                    className="input w-full"
                    placeholder="e.g. Tech Corp"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => handleJobFormChange('location', e.target.value)}
                    className="input w-full"
                    placeholder="e.g. New York, NY or Remote"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Job Type</label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => handleJobFormChange('type', e.target.value)}
                    className="input w-full"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Job Description *</label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => handleJobFormChange('description', e.target.value)}
                  className="input w-full"
                  rows="4"
                  placeholder="Describe the job role, responsibilities, and what you're looking for..."
                  required
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium mb-2">Requirements</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      className="input flex-1"
                      placeholder="Add a requirement"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    />
                    <button
                      type="button"
                      onClick={addRequirement}
                      className="btn btn-outline"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {jobForm.requirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm">{req}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium mb-2">Required Skills</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="input flex-1"
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="btn btn-outline"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {jobForm.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="ml-2 text-primary-500 hover:text-primary-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium mb-2">Salary Range</label>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="number"
                      value={jobForm.salary.min}
                      onChange={(e) => handleJobFormChange('salary.min', e.target.value)}
                      className="input w-full"
                      placeholder="Min salary"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={jobForm.salary.max}
                      onChange={(e) => handleJobFormChange('salary.max', e.target.value)}
                      className="input w-full"
                      placeholder="Max salary"
                    />
                  </div>
                  <div>
                    <select
                      value={jobForm.salary.currency}
                      onChange={(e) => handleJobFormChange('salary.currency', e.target.value)}
                      className="input w-full"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Application URL *</label>
                  <input
                    type="url"
                    value={jobForm.applyUrl}
                    onChange={(e) => handleJobFormChange('applyUrl', e.target.value)}
                    className="input w-full"
                    placeholder="https://company.com/apply"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Logo URL</label>
                  <input
                    type="url"
                    value={jobForm.companyLogo}
                    onChange={(e) => handleJobFormChange('companyLogo', e.target.value)}
                    className="input w-full"
                    placeholder="https://company.com/logo.png"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expires At</label>
                <input
                  type="date"
                  value={jobForm.expiresAt}
                  onChange={(e) => handleJobFormChange('expiresAt', e.target.value)}
                  className="input w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingJob ? 'Update Job' : 'Create Job'}
                </button>
                <button
                  type="button"
                  onClick={closeJobModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
