import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  Edit, Eye, Share2, Download, BarChart3, Settings, 
  Plus, ExternalLink, Github, Linkedin, Mail, Phone,
  MapPin, Calendar, Award, BookOpen, Briefcase, Code,
  Star, Users, TrendingUp, Globe
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Portfolio = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    projectClicks: 0,
    resumeDownloads: 0
  })

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching portfolio...')
      
      const { data } = await api.get('/portfolios/my')
      console.log('📦 Portfolio data received:', data)
      
      setPortfolio(data.portfolio)
      
      // Set stats from portfolio analytics (with safe defaults)
      const analytics = data.portfolio?.analytics || {}
      setStats({
        totalViews: analytics.totalViews || 0,
        uniqueVisitors: analytics.uniqueVisitors || 0,
        projectClicks: analytics.projectClicks || 0,
        resumeDownloads: analytics.resumeDownloads || 0
      })
      
      console.log('✅ Portfolio loaded successfully')
    } catch (error) {
      console.error('❌ Fetch portfolio error:', error)
      console.error('📋 Error details:', error.response?.data)
      
      if (error.response?.status === 401) {
        toast.error('Please log in to access your portfolio')
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Portfolio validation error')
      } else {
        toast.error('Failed to load portfolio. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSyncCourses = async () => {
    try {
      const { data } = await api.post('/portfolios/sync-courses')
      toast.success(`Synced ${data.coursesCount} courses and ${data.certificatesCount} certificates`)
      fetchPortfolio()
    } catch (error) {
      console.error('Sync courses error:', error)
      toast.error('Failed to sync courses')
    }
  }

  const handleViewPortfolio = () => {
    if (portfolio?.slug) {
      window.open(`/portfolio/${portfolio.slug}`, '_blank')
    } else {
      toast.error('Please set up your portfolio URL first')
    }
  }

  const handleSharePortfolio = async () => {
    if (portfolio?.slug) {
      const url = `${window.location.origin}/portfolio/${portfolio.slug}`
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Portfolio URL copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy URL')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Portfolio</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Showcase your professional work and achievements
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/portfolio/analytics')} className="btn btn-outline">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics
          </button>
          <button onClick={handleViewPortfolio} className="btn btn-outline">
            <Eye className="h-5 w-5 mr-2" />
            View Live
          </button>
          <button onClick={() => navigate('/portfolio/editor')} className="btn btn-primary">
            <Edit className="h-5 w-5 mr-2" />
            Edit Portfolio
          </button>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">{stats.totalViews}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.uniqueVisitors}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Unique Visitors</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.projectClicks}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Project Clicks</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{stats.resumeDownloads}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Resume Downloads</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <button onClick={handleSyncCourses} className="card hover:shadow-lg transition text-left">
          <BookOpen className="h-8 w-8 text-primary-600 mb-3" />
          <h3 className="font-semibold mb-2">Sync Courses</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Import your completed courses and certificates
          </p>
        </button>
        
        <button onClick={handleSharePortfolio} className="card hover:shadow-lg transition text-left">
          <Share2 className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold mb-2">Share Portfolio</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Copy your portfolio URL to share with others
          </p>
        </button>
        
        <button onClick={() => navigate('/portfolio/settings')} className="card hover:shadow-lg transition text-left">
          <Settings className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-semibold mb-2">Portfolio Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize themes, domains, and privacy settings
          </p>
        </button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">About Me</h2>
              <button 
                onClick={() => navigate('/portfolio/editor?tab=about')}
                className="btn btn-outline btn-sm"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>
            
            {portfolio?.about?.bio ? (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {portfolio.about.bio}
                </p>
                {portfolio.about.location && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-2" />
                    {portfolio.about.location}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Add your bio to introduce yourself</p>
                <button 
                  onClick={() => navigate('/portfolio/editor?tab=about')}
                  className="btn btn-primary"
                >
                  Add Bio
                </button>
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Featured Projects</h2>
              <button 
                onClick={() => navigate('/portfolio/editor?tab=projects')}
                className="btn btn-outline btn-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Project
              </button>
            </div>
            
            {portfolio?.projects && portfolio.projects.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {portfolio.projects.slice(0, 4).map((project, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technologies?.slice(0, 3).map((tech, i) => (
                        <span key={i} className="badge badge-primary text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {project.demoUrl && (
                        <a 
                          href={project.demoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Demo
                        </a>
                      )}
                      {project.githubUrl && (
                        <a 
                          href={project.githubUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          <Github className="h-3 w-3 mr-1" />
                          Code
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Code className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Showcase your best projects</p>
                <button 
                  onClick={() => navigate('/portfolio/editor?tab=projects')}
                  className="btn btn-primary"
                >
                  Add Your First Project
                </button>
              </div>
            )}
          </div>

          {/* Experience Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Work Experience</h2>
              <button 
                onClick={() => navigate('/portfolio/editor?tab=experience')}
                className="btn btn-outline btn-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Experience
              </button>
            </div>
            
            {portfolio?.experience && portfolio.experience.length > 0 ? (
              <div className="space-y-4">
                {portfolio.experience.slice(0, 3).map((exp, index) => (
                  <div key={index} className="border-l-4 border-l-primary-500 pl-4">
                    <h3 className="font-semibold">{exp.position}</h3>
                    <p className="text-primary-600 font-medium">{exp.company}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exp.startDate && new Date(exp.startDate).getFullYear()} - {
                        exp.current ? 'Present' : (exp.endDate && new Date(exp.endDate).getFullYear())
                      }
                    </p>
                    {exp.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Add your work experience</p>
                <button 
                  onClick={() => navigate('/portfolio/editor?tab=experience')}
                  className="btn btn-primary"
                >
                  Add Experience
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Portfolio URL */}
          <div className="card">
            <h3 className="font-semibold mb-4">Portfolio URL</h3>
            {portfolio?.slug ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    /{portfolio.slug}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleViewPortfolio} className="btn btn-outline btn-sm flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button onClick={handleSharePortfolio} className="btn btn-outline btn-sm flex-1">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">Set up your custom URL</p>
                <button 
                  onClick={() => navigate('/portfolio/editor?tab=basic')}
                  className="btn btn-primary btn-sm"
                >
                  Setup URL
                </button>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Top Skills</h3>
              <button 
                onClick={() => navigate('/portfolio/editor?tab=skills')}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Edit
              </button>
            </div>
            
            {portfolio?.skills && portfolio.skills.length > 0 ? (
              <div className="space-y-3">
                {portfolio.skills.slice(0, 5).map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{skill.name}</span>
                      <span>{skill.proficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${skill.proficiency}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">Add your skills</p>
                <button 
                  onClick={() => navigate('/portfolio/editor?tab=skills')}
                  className="btn btn-primary btn-sm"
                >
                  Add Skills
                </button>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="card">
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="space-y-3">
              {portfolio?.social?.email && (
                <a 
                  href={`mailto:${portfolio.social.email}`}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  <Mail className="h-4 w-4 mr-3" />
                  Email
                </a>
              )}
              {portfolio?.social?.linkedin && (
                <a 
                  href={portfolio.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  <Linkedin className="h-4 w-4 mr-3" />
                  LinkedIn
                </a>
              )}
              {portfolio?.social?.github && (
                <a 
                  href={portfolio.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  <Github className="h-4 w-4 mr-3" />
                  GitHub
                </a>
              )}
            </div>
          </div>

          {/* Courses & Certificates */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Achievements</h3>
              <button onClick={handleSyncCourses} className="text-primary-600 hover:text-primary-700 text-sm">
                Sync
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm">Courses</span>
                </div>
                <span className="text-sm font-semibold">
                  {portfolio?.courses?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-2 text-yellow-600" />
                  <span className="text-sm">Certificates</span>
                </div>
                <span className="text-sm font-semibold">
                  {portfolio?.certifications?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Portfolio
