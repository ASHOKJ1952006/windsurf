import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Save, Eye, Plus, Trash2, X, Upload, Github, Linkedin,
  Download, BarChart3, Settings, Link2, Sparkles, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PortfolioEditor = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching portfolio for editor...');
      
      const { data } = await api.get('/portfolios/my');
      console.log('📦 Portfolio data received:', data);
      
      // Ensure portfolio has all required sections with defaults
      const portfolioWithDefaults = {
        ...data.portfolio,
        hero: data.portfolio.hero || {},
        about: data.portfolio.about || {},
        skills: data.portfolio.skills || [],
        experience: data.portfolio.experience || [],
        education: data.portfolio.education || [],
        projects: data.portfolio.projects || [],
        social: data.portfolio.social || {},
        github: data.portfolio.github || { connected: false }
      };
      
      setPortfolio(portfolioWithDefaults);
      console.log('✅ Portfolio loaded for editing');
    } catch (error) {
      console.error('❌ Fetch portfolio error:', error);
      console.error('📋 Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Please log in to edit your portfolio');
        navigate('/login');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Portfolio validation error');
      } else {
        toast.error('Failed to load portfolio. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/portfolios/my', portfolio);
      toast.success('Portfolio saved successfully!');
    } catch (error) {
      console.error('Save portfolio error:', error);
      toast.error('Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProject = () => {
    setCurrentProject({
      title: '',
      description: '',
      detailedDescription: '',
      tags: [],
      technologies: [],
      images: [],
      demoUrl: '',
      githubUrl: '',
      visibility: 'public',
      status: 'completed'
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = async () => {
    try {
      if (currentProject._id) {
        await api.put(`/portfolios/projects/${currentProject._id}`, currentProject);
        toast.success('Project updated!');
      } else {
        await api.post('/portfolios/projects', currentProject);
        toast.success('Project added!');
      }
      setShowProjectModal(false);
      fetchPortfolio();
    } catch (error) {
      console.error('Save project error:', error);
      toast.error('Failed to save project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Delete this project?')) return;
    
    try {
      await api.delete(`/portfolios/projects/${projectId}`);
      toast.success('Project deleted');
      fetchPortfolio();
    } catch (error) {
      console.error('Delete project error:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleSyncCourses = async () => {
    try {
      const { data } = await api.post('/portfolios/sync-courses');
      toast.success(`Synced ${data.coursesCount} courses and ${data.certificatesCount} certificates`);
      fetchPortfolio();
    } catch (error) {
      console.error('Sync courses error:', error);
      toast.error('Failed to sync courses');
    }
  };

  const handleConnectGitHub = async () => {
    const username = prompt('Enter your GitHub username:');
    if (!username) return;

    const token = prompt('Enter your GitHub personal access token (optional):');
    
    try {
      await api.post('/portfolios/github/connect', { username, token });
      toast.success('GitHub connected successfully!');
      fetchPortfolio();
    } catch (error) {
      console.error('Connect GitHub error:', error);
      toast.error('Failed to connect GitHub');
    }
  };

  const handleSyncGitHub = async () => {
    try {
      await api.post('/portfolios/github/sync');
      toast.success('GitHub repositories synced!');
      fetchPortfolio();
    } catch (error) {
      console.error('Sync GitHub error:', error);
      toast.error('Failed to sync GitHub');
    }
  };

  const handleExportLinkedIn = async (format = 'json') => {
    try {
      const response = await api.get(`/portfolios/export/linkedin?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `linkedin-profile.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('LinkedIn profile exported!');
    } catch (error) {
      console.error('Export LinkedIn error:', error);
      toast.error('Failed to export');
    }
  };

  const handleViewPortfolio = () => {
    if (portfolio?.slug) {
      window.open(`/portfolio/${portfolio.slug}`, '_blank');
    }
  };

  const handleViewAnalytics = () => {
    navigate('/portfolio/analytics');
  };

  const updatePortfolio = (field, value) => {
    setPortfolio(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedField = (section, field, value) => {
    setPortfolio(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Portfolio Editor</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Build your professional portfolio and showcase your work
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleViewAnalytics} className="btn btn-outline">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics
          </button>
          <button onClick={handleViewPortfolio} className="btn btn-outline">
            <Eye className="h-5 w-5 mr-2" />
            Preview
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <button onClick={handleSyncCourses} className="card hover:shadow-lg transition text-left">
          <RefreshCw className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="font-semibold">Sync Courses</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Import completed courses & certificates</p>
        </button>
        
        <button onClick={handleConnectGitHub} className="card hover:shadow-lg transition text-left">
          <Github className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="font-semibold">Connect GitHub</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Sync your repositories</p>
        </button>
        
        <button onClick={() => handleExportLinkedIn('json')} className="card hover:shadow-lg transition text-left">
          <Linkedin className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="font-semibold">Export to LinkedIn</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Download profile data</p>
        </button>
        
        <button onClick={() => navigate('/portfolio/settings')} className="card hover:shadow-lg transition text-left">
          <Settings className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="font-semibold">Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Customize your portfolio</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b dark:border-gray-700">
        {['basic', 'about', 'experience', 'education', 'skills', 'projects', 'integrations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Portfolio URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{window.location.origin}/portfolio/</span>
                  <input
                    type="text"
                    value={portfolio?.slug || ''}
                    onChange={(e) => updatePortfolio('slug', e.target.value)}
                    className="input flex-1"
                    placeholder="your-name"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">This will be your unique portfolio URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hero Title</label>
                <input
                  type="text"
                  value={portfolio?.hero?.title || ''}
                  onChange={(e) => updateNestedField('hero', 'title', e.target.value)}
                  className="input w-full"
                  placeholder="Welcome to my portfolio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hero Subtitle</label>
                <input
                  type="text"
                  value={portfolio?.hero?.subtitle || ''}
                  onChange={(e) => updateNestedField('hero', 'subtitle', e.target.value)}
                  className="input w-full"
                  placeholder="Full Stack Developer | Designer | Creator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tagline</label>
                <input
                  type="text"
                  value={portfolio?.hero?.tagline || ''}
                  onChange={(e) => updateNestedField('hero', 'tagline', e.target.value)}
                  className="input w-full"
                  placeholder="Building amazing digital experiences"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Button Text</label>
                  <input
                    type="text"
                    value={portfolio?.hero?.ctaText || ''}
                    onChange={(e) => updateNestedField('hero', 'ctaText', e.target.value)}
                    className="input w-full"
                    placeholder="Get in touch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Button Link</label>
                  <input
                    type="url"
                    value={portfolio?.hero?.ctaLink || ''}
                    onChange={(e) => updateNestedField('hero', 'ctaLink', e.target.value)}
                    className="input w-full"
                    placeholder="mailto:you@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={portfolio?.isPublic !== false}
                    onChange={(e) => updatePortfolio('isPublic', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Make portfolio public</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">About Me</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Short Bio</label>
              <textarea
                value={portfolio?.about?.bio || ''}
                onChange={(e) => updateNestedField('about', 'bio', e.target.value)}
                className="input w-full"
                rows="3"
                placeholder="A brief introduction about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Detailed Bio</label>
              <textarea
                value={portfolio?.about?.longBio || ''}
                onChange={(e) => updateNestedField('about', 'longBio', e.target.value)}
                className="input w-full"
                rows="8"
                placeholder="Tell your story in detail..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={portfolio?.about?.location || ''}
                  onChange={(e) => updateNestedField('about', 'location', e.target.value)}
                  className="input w-full"
                  placeholder="San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={portfolio?.about?.yearsOfExperience || ''}
                  onChange={(e) => updateNestedField('about', 'yearsOfExperience', parseInt(e.target.value))}
                  className="input w-full"
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Availability Status</label>
              <select
                value={portfolio?.about?.availability || 'available'}
                onChange={(e) => updateNestedField('about', 'availability', e.target.value)}
                className="input w-full"
              >
                <option value="available">Available for work</option>
                <option value="busy">Busy</option>
                <option value="not-looking">Not looking</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'experience' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Work Experience</h2>
            <button 
              onClick={() => {
                const newExperience = {
                  company: '',
                  position: '',
                  location: '',
                  description: '',
                  achievements: [],
                  startDate: '',
                  endDate: '',
                  current: false,
                  companyLogo: '',
                  showInPortfolio: true
                };
                setPortfolio(prev => ({
                  ...prev,
                  experience: [...(prev.experience || []), newExperience]
                }));
              }}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Experience
            </button>
          </div>

          {portfolio?.experience && portfolio.experience.length > 0 ? (
            <div className="space-y-6">
              {portfolio.experience.map((exp, index) => (
                <div key={index} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Experience {index + 1}</h3>
                    <button 
                      onClick={() => {
                        setPortfolio(prev => ({
                          ...prev,
                          experience: prev.experience.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Position *</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const newExperience = [...portfolio.experience];
                          newExperience[index].position = e.target.value;
                          setPortfolio(prev => ({ ...prev, experience: newExperience }));
                        }}
                        className="input w-full"
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Company *</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExperience = [...portfolio.experience];
                          newExperience[index].company = e.target.value;
                          setPortfolio(prev => ({ ...prev, experience: newExperience }));
                        }}
                        className="input w-full"
                        placeholder="Tech Company Inc."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => {
                          const newExperience = [...portfolio.experience];
                          newExperience[index].location = e.target.value;
                          setPortfolio(prev => ({ ...prev, experience: newExperience }));
                        }}
                        className="input w-full"
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate ? exp.startDate.substring(0, 7) : ''}
                        onChange={(e) => {
                          const newExperience = [...portfolio.experience];
                          newExperience[index].startDate = e.target.value;
                          setPortfolio(prev => ({ ...prev, experience: newExperience }));
                        }}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <input
                        type="month"
                        value={exp.current ? '' : (exp.endDate ? exp.endDate.substring(0, 7) : '')}
                        onChange={(e) => {
                          const newExperience = [...portfolio.experience];
                          newExperience[index].endDate = e.target.value;
                          setPortfolio(prev => ({ ...prev, experience: newExperience }));
                        }}
                        className="input w-full"
                        disabled={exp.current}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => {
                          const newExperience = [...portfolio.experience];
                          newExperience[index].current = e.target.checked;
                          if (e.target.checked) {
                            newExperience[index].endDate = '';
                          }
                          setPortfolio(prev => ({ ...prev, experience: newExperience }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Current Position</span>
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExperience = [...portfolio.experience];
                        newExperience[index].description = e.target.value;
                        setPortfolio(prev => ({ ...prev, experience: newExperience }));
                      }}
                      className="input w-full"
                      rows="3"
                      placeholder="Describe your role and responsibilities..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Key Achievements (one per line)</label>
                    <textarea
                      value={exp.achievements?.join('\n') || ''}
                      onChange={(e) => {
                        const newExperience = [...portfolio.experience];
                        newExperience[index].achievements = e.target.value.split('\n').filter(Boolean);
                        setPortfolio(prev => ({ ...prev, experience: newExperience }));
                      }}
                      className="input w-full"
                      rows="4"
                      placeholder="• Increased team productivity by 30%&#10;• Led development of key features&#10;• Mentored junior developers"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No work experience added yet</p>
              <button 
                onClick={() => {
                  const newExperience = {
                    company: '',
                    position: '',
                    location: '',
                    description: '',
                    achievements: [],
                    startDate: '',
                    endDate: '',
                    current: false,
                    companyLogo: '',
                    showInPortfolio: true
                  };
                  setPortfolio(prev => ({
                    ...prev,
                    experience: [newExperience]
                  }));
                }}
                className="btn btn-primary"
              >
                Add Your First Experience
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'education' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Education</h2>
            <button 
              onClick={() => {
                const newEducation = {
                  institution: '',
                  degree: '',
                  field: '',
                  startDate: '',
                  endDate: '',
                  gpa: '',
                  achievements: [],
                  showInPortfolio: true
                };
                setPortfolio(prev => ({
                  ...prev,
                  education: [...(prev.education || []), newEducation]
                }));
              }}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Education
            </button>
          </div>

          {portfolio?.education && portfolio.education.length > 0 ? (
            <div className="space-y-6">
              {portfolio.education.map((edu, index) => (
                <div key={index} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Education {index + 1}</h3>
                    <button 
                      onClick={() => {
                        setPortfolio(prev => ({
                          ...prev,
                          education: prev.education.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Institution *</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEducation = [...portfolio.education];
                          newEducation[index].institution = e.target.value;
                          setPortfolio(prev => ({ ...prev, education: newEducation }));
                        }}
                        className="input w-full"
                        placeholder="University of Technology"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Degree *</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEducation = [...portfolio.education];
                          newEducation[index].degree = e.target.value;
                          setPortfolio(prev => ({ ...prev, education: newEducation }));
                        }}
                        className="input w-full"
                        placeholder="Bachelor of Science"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => {
                          const newEducation = [...portfolio.education];
                          newEducation[index].field = e.target.value;
                          setPortfolio(prev => ({ ...prev, education: newEducation }));
                        }}
                        className="input w-full"
                        placeholder="Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <input
                        type="month"
                        value={edu.startDate ? edu.startDate.substring(0, 7) : ''}
                        onChange={(e) => {
                          const newEducation = [...portfolio.education];
                          newEducation[index].startDate = e.target.value;
                          setPortfolio(prev => ({ ...prev, education: newEducation }));
                        }}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <input
                        type="month"
                        value={edu.endDate ? edu.endDate.substring(0, 7) : ''}
                        onChange={(e) => {
                          const newEducation = [...portfolio.education];
                          newEducation[index].endDate = e.target.value;
                          setPortfolio(prev => ({ ...prev, education: newEducation }));
                        }}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">GPA (optional)</label>
                    <input
                      type="text"
                      value={edu.gpa}
                      onChange={(e) => {
                        const newEducation = [...portfolio.education];
                        newEducation[index].gpa = e.target.value;
                        setPortfolio(prev => ({ ...prev, education: newEducation }));
                      }}
                      className="input w-full"
                      placeholder="3.8/4.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Achievements (one per line)</label>
                    <textarea
                      value={edu.achievements?.join('\n') || ''}
                      onChange={(e) => {
                        const newEducation = [...portfolio.education];
                        newEducation[index].achievements = e.target.value.split('\n').filter(Boolean);
                        setPortfolio(prev => ({ ...prev, education: newEducation }));
                      }}
                      className="input w-full"
                      rows="3"
                      placeholder="• Dean's List&#10;• Graduated Magna Cum Laude&#10;• President of Computer Science Club"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No education added yet</p>
              <button 
                onClick={() => {
                  const newEducation = {
                    institution: '',
                    degree: '',
                    field: '',
                    startDate: '',
                    endDate: '',
                    gpa: '',
                    achievements: [],
                    showInPortfolio: true
                  };
                  setPortfolio(prev => ({
                    ...prev,
                    education: [newEducation]
                  }));
                }}
                className="btn btn-primary"
              >
                Add Your First Education
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'skills' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Skills</h2>
            <button 
              onClick={() => {
                const skillName = prompt('Enter skill name:');
                if (skillName) {
                  const newSkill = {
                    name: skillName,
                    category: 'technical',
                    proficiency: 75,
                    yearsOfExperience: 1,
                    endorsed: false,
                    showInPortfolio: true
                  };
                  setPortfolio(prev => ({
                    ...prev,
                    skills: [...(prev.skills || []), newSkill]
                  }));
                }
              }}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Skill
            </button>
          </div>

          {portfolio?.skills && portfolio.skills.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {portfolio.skills.map((skill, index) => (
                <div key={index} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{skill.name}</h3>
                    <button 
                      onClick={() => {
                        setPortfolio(prev => ({
                          ...prev,
                          skills: prev.skills.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Skill Name</label>
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => {
                          const newSkills = [...portfolio.skills];
                          newSkills[index].name = e.target.value;
                          setPortfolio(prev => ({ ...prev, skills: newSkills }));
                        }}
                        className="input w-full"
                        placeholder="JavaScript"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={skill.category}
                        onChange={(e) => {
                          const newSkills = [...portfolio.skills];
                          newSkills[index].category = e.target.value;
                          setPortfolio(prev => ({ ...prev, skills: newSkills }));
                        }}
                        className="input w-full"
                      >
                        <option value="technical">Technical</option>
                        <option value="soft">Soft Skills</option>
                        <option value="language">Language</option>
                        <option value="tool">Tool</option>
                        <option value="framework">Framework</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Proficiency: {skill.proficiency}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={skill.proficiency}
                        onChange={(e) => {
                          const newSkills = [...portfolio.skills];
                          newSkills[index].proficiency = parseInt(e.target.value);
                          setPortfolio(prev => ({ ...prev, skills: newSkills }));
                        }}
                        className="w-full"
                      />
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={skill.yearsOfExperience || 0}
                        onChange={(e) => {
                          const newSkills = [...portfolio.skills];
                          newSkills[index].yearsOfExperience = parseInt(e.target.value);
                          setPortfolio(prev => ({ ...prev, skills: newSkills }));
                        }}
                        className="input w-full"
                        placeholder="2"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={skill.showInPortfolio}
                          onChange={(e) => {
                            const newSkills = [...portfolio.skills];
                            newSkills[index].showInPortfolio = e.target.checked;
                            setPortfolio(prev => ({ ...prev, skills: newSkills }));
                          }}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Show in Portfolio</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No skills added yet</p>
              <button 
                onClick={() => {
                  const skillName = prompt('Enter skill name:');
                  if (skillName) {
                    const newSkill = {
                      name: skillName,
                      category: 'technical',
                      proficiency: 75,
                      yearsOfExperience: 1,
                      endorsed: false,
                      showInPortfolio: true
                    };
                    setPortfolio(prev => ({
                      ...prev,
                      skills: [newSkill]
                    }));
                  }
                }}
                className="btn btn-primary"
              >
                Add Your First Skill
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Projects</h2>
            <button onClick={handleAddProject} className="btn btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Add Project
            </button>
          </div>

          {portfolio?.projects && portfolio.projects.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {portfolio.projects.map((project) => (
                <div key={project._id} className="card">
                  {project.thumbnail && (
                    <img src={project.thumbnail} alt={project.title} className="w-full h-32 object-cover rounded mb-4" />
                  )}
                  <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies?.map((tech, i) => (
                      <span key={i} className="badge badge-primary">{tech}</span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setCurrentProject(project);
                        setShowProjectModal(true);
                      }}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project._id)}
                      className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No projects yet</p>
              <button onClick={handleAddProject} className="btn btn-primary">
                Add Your First Project
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* GitHub Integration */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">GitHub Integration</h2>
            
            {portfolio?.github?.connected ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Connected as @{portfolio.github.username}</p>
                    <p className="text-sm text-gray-500">
                      {portfolio.github.repositories?.length || 0} repositories synced
                    </p>
                  </div>
                  <button onClick={handleSyncGitHub} className="btn btn-outline">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Sync Now
                  </button>
                </div>
                
                {portfolio.github.stats && (
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold">{portfolio.github.stats.totalRepos}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Repos</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold">{portfolio.github.stats.totalStars}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Stars</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold">{portfolio.github.stats.totalCommits}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Commits</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold">{portfolio.github.stats.totalPRs}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">PRs</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Github className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">Connect your GitHub account to showcase your repositories</p>
                <button onClick={handleConnectGitHub} className="btn btn-primary">
                  <Github className="h-5 w-5 mr-2" />
                  Connect GitHub
                </button>
              </div>
            )}
          </div>

          {/* LinkedIn Export */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">LinkedIn Export</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Export your portfolio data to update your LinkedIn profile
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleExportLinkedIn('json')} className="btn btn-primary">
                <Download className="h-5 w-5 mr-2" />
                Export as JSON
              </button>
              <button onClick={() => handleExportLinkedIn('text')} className="btn btn-outline">
                <Download className="h-5 w-5 mr-2" />
                Export as Text
              </button>
              <button onClick={() => handleExportLinkedIn('csv')} className="btn btn-outline">
                <Download className="h-5 w-5 mr-2" />
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">
                {currentProject?._id ? 'Edit Project' : 'Add Project'}
              </h3>
              <button onClick={() => setShowProjectModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Title *</label>
                <input
                  type="text"
                  value={currentProject?.title || ''}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, title: e.target.value }))}
                  className="input w-full"
                  placeholder="My Awesome Project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Short Description *</label>
                <textarea
                  value={currentProject?.description || ''}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full"
                  rows="3"
                  placeholder="Brief description of your project..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detailed Description</label>
                <textarea
                  value={currentProject?.detailedDescription || ''}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, detailedDescription: e.target.value }))}
                  className="input w-full"
                  rows="6"
                  placeholder="Full project details, challenges, solutions..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Demo URL</label>
                  <input
                    type="url"
                    value={currentProject?.demoUrl || ''}
                    onChange={(e) => setCurrentProject(prev => ({ ...prev, demoUrl: e.target.value }))}
                    className="input w-full"
                    placeholder="https://project-demo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={currentProject?.githubUrl || ''}
                    onChange={(e) => setCurrentProject(prev => ({ ...prev, githubUrl: e.target.value }))}
                    className="input w-full"
                    placeholder="https://github.com/user/repo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={currentProject?.technologies?.join(', ') || ''}
                  onChange={(e) => setCurrentProject(prev => ({ 
                    ...prev, 
                    technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  }))}
                  className="input w-full"
                  placeholder="React, Node.js, MongoDB"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={currentProject?.status || 'completed'}
                    onChange={(e) => setCurrentProject(prev => ({ ...prev, status: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Visibility</label>
                  <select
                    value={currentProject?.visibility || 'public'}
                    onChange={(e) => setCurrentProject(prev => ({ ...prev, visibility: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 p-6 flex gap-3 justify-end">
              <button onClick={() => setShowProjectModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleSaveProject} className="btn btn-primary">
                {currentProject?._id ? 'Update Project' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioEditor;
