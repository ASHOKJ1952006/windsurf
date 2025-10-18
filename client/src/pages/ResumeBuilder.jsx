import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FileText, Download, Save, Eye, Sparkles, Plus, X, Trash2, Image, Printer, FileJson, Type, Palette } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import ResumePreview from '../components/ResumePreview'
import { 
  exportAsPDF, 
  exportAsImage, 
  exportAsJSON, 
  exportAsText,
  loadHtml2Canvas,
  isHtml2CanvasAvailable 
} from '../utils/resumeExport'

const ResumeBuilder = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(false)
  const resumePreviewRef = useRef(null)
  
  const [formData, setFormData] = useState({
    title: 'My Resume',
    contact: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    headline: '',
    summary: '',
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    awards: [],
    languages: [],
    template: 'professional'
  })

  useEffect(() => {
    fetchResumes()
    // Check if html2canvas is available
    setHtml2canvasLoaded(isHtml2CanvasAvailable())
  }, [])

  useEffect(() => {
    // Auto-save every 10 seconds
    const autoSaveInterval = setInterval(() => {
      if (selectedResume) {
        handleAutoSave()
      }
    }, 10000)

    return () => clearInterval(autoSaveInterval)
  }, [formData, selectedResume])

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes')
      setResumes(data.resumes || [])
    } catch (error) {
      console.error('Fetch resumes error:', error)
    }
  }

  const handleAutoSave = async () => {
    if (!selectedResume) return
    
    try {
      await api.put(`/resumes/${selectedResume._id}`, formData)
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (selectedResume) {
        const { data } = await api.put(`/resumes/${selectedResume._id}`, formData)
        toast.success('Resume updated successfully!')
        setSelectedResume(data.resume)
      } else {
        const { data } = await api.post('/resumes', formData)
        toast.success('Resume created successfully!')
        setSelectedResume(data.resume)
        fetchResumes()
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  const handleGetAISuggestions = async () => {
    if (!selectedResume) {
      toast.error('Please save your resume first')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post(`/resumes/${selectedResume._id}/ai-suggestions`)
      setAiSuggestions(data)
      toast.success(`ATS Score: ${data.atsScore}/100`)
    } catch (error) {
      console.error('AI suggestions error:', error)
      toast.error('Failed to generate suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!formData.contact?.fullName) {
      toast.error('Please add your name before exporting')
      return
    }

    setExporting(true)
    try {
      await exportAsPDF(formData, formData.template)
      toast.success('PDF export initiated - Check your downloads!')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error(error.message || 'Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const handleExportImage = async () => {
    if (!formData.contact?.fullName) {
      toast.error('Please add your name before exporting')
      return
    }

    if (!resumePreviewRef.current) {
      toast.error('Please open preview first')
      return
    }

    setExporting(true)
    try {
      // Load html2canvas if not available
      if (!html2canvasLoaded) {
        toast.info('Loading image export library...')
        await loadHtml2Canvas()
        setHtml2canvasLoaded(true)
      }

      const filename = formData.title.replace(/\s+/g, '_')
      await exportAsImage(resumePreviewRef, filename)
      toast.success('Image exported successfully!')
    } catch (error) {
      console.error('Image export error:', error)
      toast.error(error.message || 'Failed to export image')
    } finally {
      setExporting(false)
    }
  }

  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const filename = formData.title.replace(/\s+/g, '_')
      await exportAsJSON(formData, filename)
      toast.success('Resume data exported as JSON!')
    } catch (error) {
      console.error('JSON export error:', error)
      toast.error('Failed to export JSON')
    } finally {
      setExporting(false)
    }
  }

  const handleExportText = async () => {
    if (!formData.contact?.fullName) {
      toast.error('Please add your name before exporting')
      return
    }

    setExporting(true)
    try {
      const filename = formData.title.replace(/\s+/g, '_')
      await exportAsText(formData, filename)
      toast.success('Text file exported successfully!')
    } catch (error) {
      console.error('Text export error:', error)
      toast.error('Failed to export text file')
    } finally {
      setExporting(false)
    }
  }

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        achievements: []
      }]
    }))
  }

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const updateExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: ''
      }]
    }))
  }

  const addSkill = (skillName) => {
    if (!skillName.trim()) return
    
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, {
        name: skillName,
        category: 'technical',
        proficiency: 'intermediate'
      }]
    }))
  }

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const loadResume = (resume) => {
    setSelectedResume(resume)
    setFormData(resume)
  }

  const createNewResume = () => {
    setSelectedResume(null)
    setFormData({
      title: 'My Resume',
      contact: {
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: ''
      },
      headline: '',
      summary: '',
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certifications: [],
      awards: [],
      languages: [],
      template: 'professional'
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Resume Builder</h1>
          <p className="text-gray-600 dark:text-gray-400">Create ATS-friendly, professional resumes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={createNewResume} className="btn btn-outline">
            <Plus className="h-5 w-5 mr-2" />
            New Resume
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Resume List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Your Resumes</h2>
            <div className="space-y-2">
              {resumes.map((resume) => (
                <div
                  key={resume._id}
                  onClick={() => loadResume(resume)}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedResume?._id === resume._id ? 'bg-primary-50 dark:bg-primary-900' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{resume.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(resume.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      resume.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {resume.status}
                    </span>
                  </div>
                </div>
              ))}
              {resumes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No resumes yet</p>
              )}
            </div>
          </div>

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="card mt-4">
              <h3 className="font-semibold mb-2">ATS Score</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Score</span>
                  <span className="font-bold text-lg">{aiSuggestions.atsScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${aiSuggestions.atsScore}%` }}
                  />
                </div>
              </div>
              {aiSuggestions.improvements && aiSuggestions.improvements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Improvements</h4>
                  <ul className="text-xs space-y-1">
                    {aiSuggestions.improvements.map((imp, i) => (
                      <li key={i} className="text-gray-600 dark:text-gray-400">• {imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Actions Bar */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-bold bg-transparent border-none outline-none"
                placeholder="Resume Title"
              />
              <div className="flex gap-2">
                <button onClick={handleGetAISuggestions} className="btn btn-outline btn-sm">
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Suggestions
                </button>
                <button onClick={() => setShowPreview(!showPreview)} className="btn btn-outline btn-sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </button>
                <div className="relative group">
                  <button className="btn btn-primary btn-sm" disabled={exporting}>
                    <Download className="h-4 w-4 mr-1" />
                    {exporting ? 'Exporting...' : 'Export'}
                  </button>
                  <div className="hidden group-hover:block absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border">
                    <button 
                      onClick={handleExportPDF} 
                      className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      disabled={exporting}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      PDF
                    </button>
                    <button 
                      onClick={handleExportImage} 
                      className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={exporting}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Image (PNG)
                    </button>
                    <button 
                      onClick={handleExportText} 
                      className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={exporting}
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Text File
                    </button>
                    <button 
                      onClick={handleExportJSON} 
                      className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                      disabled={exporting}
                    >
                      <FileJson className="h-4 w-4 mr-2" />
                      JSON Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Template Selection */}
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Palette className="h-5 w-5 mr-2 text-gray-600" />
                <span className="font-medium text-sm">Template:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, template: 'professional' }))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    formData.template === 'professional' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Professional
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, template: 'modern' }))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    formData.template === 'modern' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Modern
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, template: 'creative' }))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    formData.template === 'creative' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Creative
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.contact.fullName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, fullName: e.target.value }
                }))}
                className="input"
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.contact.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, email: e.target.value }
                }))}
                className="input"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.contact.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, phone: e.target.value }
                }))}
                className="input"
              />
              <input
                type="text"
                placeholder="Location"
                value={formData.contact.location}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, location: e.target.value }
                }))}
                className="input"
              />
              <input
                type="url"
                placeholder="LinkedIn URL"
                value={formData.contact.linkedin}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, linkedin: e.target.value }
                }))}
                className="input"
              />
              <input
                type="url"
                placeholder="GitHub URL"
                value={formData.contact.github}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, github: e.target.value }
                }))}
                className="input"
              />
            </div>
          </div>

          {/* Professional Summary */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Professional Summary</h2>
            <input
              type="text"
              placeholder="Professional Headline"
              value={formData.headline}
              onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
              className="input mb-4"
            />
            <textarea
              placeholder="Write a compelling summary (150-200 words)..."
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              className="input"
              rows="5"
            />
            <p className="text-sm text-gray-500 mt-2">{formData.summary.length} characters</p>
          </div>

          {/* Experience */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Experience</h2>
              <button onClick={addExperience} className="btn btn-outline btn-sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Experience
              </button>
            </div>
            {formData.experience.map((exp, index) => (
              <div key={index} className="border dark:border-gray-700 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold">Experience {index + 1}</h3>
                  <button onClick={() => removeExperience(index)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Position *"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Company *"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={exp.location}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                    className="input"
                  />
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Current Position</span>
                    </label>
                  </div>
                  <input
                    type="month"
                    placeholder="Start Date"
                    value={exp.startDate ? exp.startDate.substring(0, 7) : ''}
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    className="input"
                  />
                  {!exp.current && (
                    <input
                      type="month"
                      placeholder="End Date"
                      value={exp.endDate ? exp.endDate.substring(0, 7) : ''}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                      className="input"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Education</h2>
              <button onClick={addEducation} className="btn btn-outline btn-sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Education
              </button>
            </div>
            {formData.education.map((edu, index) => (
              <div key={index} className="border dark:border-gray-700 rounded-lg p-4 mb-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Institution *"
                    value={edu.institution}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      education: prev.education.map((ed, i) => 
                        i === index ? { ...ed, institution: e.target.value } : ed
                      )
                    }))}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Degree *"
                    value={edu.degree}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      education: prev.education.map((ed, i) => 
                        i === index ? { ...ed, degree: e.target.value } : ed
                      )
                    }))}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Field of Study"
                    value={edu.field}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      education: prev.education.map((ed, i) => 
                        i === index ? { ...ed, field: e.target.value } : ed
                      )
                    }))}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="GPA (optional)"
                    value={edu.gpa}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      education: prev.education.map((ed, i) => 
                        i === index ? { ...ed, gpa: e.target.value } : ed
                      )
                    }))}
                    className="input"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Skills</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a skill..."
                className="input flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(e.target.value)
                    e.target.value = ''
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.target.previousSibling
                  addSkill(input.value)
                  input.value = ''
                }}
                className="btn btn-primary"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span key={index} className="badge badge-primary flex items-center">
                  {skill.name}
                  <button
                    onClick={() => removeSkill(index)}
                    className="ml-2 hover:text-red-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Resume Preview - {formData.template.charAt(0).toUpperCase() + formData.template.slice(1)} Template</h3>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, template: 'professional' }))}
                    className={`px-2 py-1 rounded text-xs ${
                      formData.template === 'professional' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Professional
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, template: 'modern' }))}
                    className={`px-2 py-1 rounded text-xs ${
                      formData.template === 'modern' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Modern
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, template: 'creative' }))}
                    className={`px-2 py-1 rounded text-xs ${
                      formData.template === 'creative' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Creative
                  </button>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="flex justify-center">
                <div className="transform scale-75 origin-top">
                  <ResumePreview 
                    ref={resumePreviewRef}
                    resumeData={formData} 
                    template={formData.template}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t bg-gray-50 dark:bg-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Preview updates automatically as you edit
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="btn btn-outline btn-sm"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Export PDF
                </button>
                <button
                  onClick={handleExportImage}
                  disabled={exporting}
                  className="btn btn-primary btn-sm"
                >
                  <Image className="h-4 w-4 mr-1" />
                  Export Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeBuilder
