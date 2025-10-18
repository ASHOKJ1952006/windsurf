import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BookOpen, Plus, X, Upload, Video, FileText, HelpCircle, Award, Save } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const EditCourse = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Course data state
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    price: 0,
    isPremium: false,
    tags: [],
    requirements: [],
    whatYouWillLearn: [],
    modules: [],
    thumbnail: ''
  })

  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [newTag, setNewTag] = useState('')
  const [newRequirement, setNewRequirement] = useState('')
  const [newLearningPoint, setNewLearningPoint] = useState('')

  // Load course data
  useEffect(() => {
    if (id) {
      fetchCourseData()
    }
  }, [id])

  const fetchCourseData = async () => {
    try {
      const { data } = await api.get(`/courses/${id}`)
      
      // Check if user is the course instructor
      if (data.course.instructor._id !== user?.id && data.course.instructor._id !== user?._id) {
        toast.error('You are not authorized to edit this course')
        navigate('/dashboard')
        return
      }

      setCourseData(data.course)
      setThumbnailPreview(data.course.thumbnail || '')
      setLoading(false)
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Failed to load course data')
      navigate('/dashboard')
    }
  }

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
      
      try {
        const formData = new FormData()
        formData.append('thumbnail', file)
        
        const { data } = await api.post('/courses/upload-thumbnail', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        setCourseData(prev => ({ ...prev, thumbnail: data.thumbnailUrl }))
        toast.success('Thumbnail uploaded!')
      } catch (error) {
        console.error('Thumbnail upload error:', error)
        toast.error('Failed to upload thumbnail')
      }
    }
  }

  const addTag = () => {
    if (newTag.trim() && !courseData.tags.includes(newTag.trim())) {
      setCourseData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (index) => {
    setCourseData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setCourseData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (index) => {
    setCourseData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addLearningPoint = () => {
    if (newLearningPoint.trim()) {
      setCourseData(prev => ({
        ...prev,
        whatYouWillLearn: [...prev.whatYouWillLearn, newLearningPoint.trim()]
      }))
      setNewLearningPoint('')
    }
  }

  const removeLearningPoint = (index) => {
    setCourseData(prev => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('=== Update Course - User Debug ===')
    console.log('User object:', user)
    console.log('User ID (_id):', user?._id)
    console.log('User ID (id):', user?.id)
    console.log('User role:', user?.role)
    
    if (!user) {
      console.error('❌ No user object found')
      toast.error('You must be logged in to update courses')
      return
    }
    
    const userId = user._id || user.id
    if (!userId) {
      console.error('❌ No user ID found in user object')
      toast.error('User ID not found. Please try logging in again.')
      return
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      console.error(`❌ Invalid role: ${user.role}`)
      toast.error(`Only instructors can update courses. Your role: ${user.role}`)
      return
    }
    
    console.log('✅ User validation passed')
    
    if (!courseData.title || !courseData.description || !courseData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    if (courseData.modules.length === 0) {
      toast.error('Please add at least one module')
      return
    }

    setSaving(true)
    try {
      const updateData = {
        ...courseData,
        // Remove populated fields that shouldn't be sent
        instructor: undefined,
        reviews: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        __v: undefined
      }

      const { data } = await api.put(`/courses/${id}`, updateData)
      toast.success('Course updated successfully!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Course update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update course')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Edit Course</h1>
        <p className="text-gray-600 dark:text-gray-400">Update your course details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course Title *</label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                className="input w-full"
                placeholder="e.g., Complete Web Development Bootcamp"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={courseData.description}
                onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                className="input w-full"
                rows="4"
                placeholder="Describe what students will learn in this course"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={courseData.category}
                  onChange={(e) => setCourseData(prev => ({ ...prev, category: e.target.value }))}
                  className="input w-full"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level *</label>
                <select
                  value={courseData.level}
                  onChange={(e) => setCourseData(prev => ({ ...prev, level: e.target.value }))}
                  className="input w-full"
                  required
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price ($)</label>
                <input
                  type="number"
                  value={courseData.price}
                  onChange={(e) => setCourseData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="input w-full"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex items-center pt-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseData.isPremium}
                    onChange={(e) => setCourseData(prev => ({ ...prev, isPremium: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Premium Course</span>
                </label>
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium mb-2">Course Thumbnail</label>
              <div className="flex items-center space-x-4">
                {thumbnailPreview && (
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview" 
                    className="w-32 h-20 object-cover rounded"
                  />
                )}
                <label className="btn btn-outline cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {thumbnailPreview ? 'Change' : 'Upload'} Thumbnail
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {courseData.tags.map((tag, index) => (
              <span key={index} className="badge badge-primary flex items-center">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="input flex-1"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={addTag}
              className="btn btn-outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Requirements</h2>
          <ul className="list-disc list-inside space-y-2 mb-4">
            {courseData.requirements.map((req, index) => (
              <li key={index} className="flex items-center justify-between">
                <span>{req}</span>
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              className="input flex-1"
              placeholder="Add a requirement"
            />
            <button
              type="button"
              onClick={addRequirement}
              className="btn btn-outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">What You'll Learn</h2>
          <ul className="list-disc list-inside space-y-2 mb-4">
            {courseData.whatYouWillLearn.map((point, index) => (
              <li key={index} className="flex items-center justify-between">
                <span>{point}</span>
                <button
                  type="button"
                  onClick={() => removeLearningPoint(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLearningPoint}
              onChange={(e) => setNewLearningPoint(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningPoint())}
              className="input flex-1"
              placeholder="Add a learning outcome"
            />
            <button
              type="button"
              onClick={addLearningPoint}
              className="btn btn-outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
        </div>

        {/* Course Content Summary */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Course Content</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ Course has {courseData.modules?.length || 0} modules with{' '}
              {courseData.modules?.reduce((total, module) => total + (module.lectures?.length || 0), 0) || 0} lectures.
              To modify course content structure, please create a new version of the course.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Updating...' : 'Update Course'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditCourse
