import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BookOpen, Plus, X, Upload, Video, FileText, HelpCircle, Award } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const CreateCourse = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  // Redirect if user is not an instructor or admin
  useEffect(() => {
    if (user && user.role !== 'instructor' && user.role !== 'admin') {
      toast.error('Only instructors and administrators can create courses')
      navigate('/dashboard')
    }
  }, [user, navigate])
  
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
  const [currentModule, setCurrentModule] = useState({
    title: '',
    description: '',
    lectures: []
  })
  const [currentLecture, setCurrentLecture] = useState({
    title: '',
    description: '',
    type: 'video',
    videoUrl: '',
    content: '',
    duration: 0,
    quiz: {
      questions: [],
      passingScore: 70,
      timeLimit: 30,
      attempts: 3
    }
  })
  
  const [videoFile, setVideoFile] = useState(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10
  })
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [isAddingLecture, setIsAddingLecture] = useState(false)
  const [editingModuleIndex, setEditingModuleIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const categories = [
    'Web Development',
    'Mobile Development', 
    'Data Science',
    'Machine Learning',
    'Design',
    'Business',
    'Marketing',
    'Other'
  ]

  const lectureTypes = [
    { value: 'video', label: 'Video', icon: Video },
    { value: 'text', label: 'Text/Article', icon: FileText },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle },
    { value: 'assignment', label: 'Assignment', icon: Award }
  ]

  const handleInputChange = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadThumbnail = async () => {
    if (!thumbnailFile) return null

    try {
      console.log('Uploading thumbnail file:', thumbnailFile.name, thumbnailFile.size)
      
      const formData = new FormData()
      formData.append('thumbnail', thumbnailFile)

      console.log('FormData created, making API call...')
      
      const { data } = await api.post('/courses/upload-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      console.log('Thumbnail upload response:', data)
      return data.thumbnailUrl
    } catch (error) {
      console.error('Thumbnail upload error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      if (error.response?.status === 413) {
        toast.error('File too large. Please choose a smaller image.')
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid file format')
      } else if (error.response?.status === 500) {
        toast.error('Server error while uploading thumbnail. Please try again.')
      } else {
        toast.error('Failed to upload thumbnail')
      }
      return null
    }
  }

  const handleVideoUpload = async (file) => {
    if (!file) return null

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 500MB.')
      return null
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv']
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('video/')) {
      toast.error('Invalid file type. Please upload a video file.')
      return null
    }

    try {
      setUploadingVideo(true)
      const formData = new FormData()
      formData.append('video', file)

      console.log('Uploading video:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      const { data } = await api.post('/courses/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000, // 5 minutes timeout for large files
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${percentCompleted}%`)
          // You can add a progress bar here if needed
        }
      })
      
      if (data.success) {
        toast.success('Video uploaded successfully!')
        return data.videoUrl
      } else {
        throw new Error(data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Video upload error:', error)
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Upload timeout. Please try with a smaller file.')
      } else if (error.response?.status === 413) {
        toast.error('File too large for server. Try a smaller file.')
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid file or upload error')
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.')
      } else {
        toast.error('Failed to upload video. Please try again.')
      }
      return null
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
      const videoUrl = await handleVideoUpload(file)
      if (videoUrl) {
        setCurrentLecture(prev => ({ ...prev, videoUrl }))
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

  const addQuestionToLecture = () => {
    // Validate question
    if (!currentQuestion.question.trim()) {
      toast.error('Please enter a question')
      return
    }

    // Validate all options are filled
    const emptyOptions = currentQuestion.options.filter(opt => !opt.trim())
    if (emptyOptions.length > 0) {
      toast.error('Please fill in all answer options')
      return
    }

    // Validate correct answer is selected
    if (currentQuestion.correctAnswer === undefined || currentQuestion.correctAnswer < 0) {
      toast.error('Please select the correct answer')
      return
    }

    // Add question to lecture
    setCurrentLecture(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        questions: [...prev.quiz.questions, { ...currentQuestion, id: Date.now() }]
      }
    }))
    
    // Reset form
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10
    })
    setIsAddingQuestion(false)
    toast.success('✅ Question added successfully!')
  }

  const removeQuestionFromLecture = (questionIndex) => {
    setCurrentLecture(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        questions: prev.quiz.questions.filter((_, i) => i !== questionIndex)
      }
    }))
    toast.success('Question removed')
  }

  const addLectureToModule = () => {
    if (currentLecture.title.trim()) {
      setCurrentModule(prev => ({
        ...prev,
        lectures: [...prev.lectures, { ...currentLecture, order: prev.lectures.length }]
      }))
      setCurrentLecture({
        title: '',
        description: '',
        type: 'video',
        videoUrl: '',
        content: '',
        duration: 0,
        quiz: {
          questions: [],
          passingScore: 70,
          timeLimit: 30,
          attempts: 3
        }
      })
      setVideoFile(null)
      setIsAddingLecture(false)
    }
  }

  const removeLectureFromModule = (lectureIndex) => {
    setCurrentModule(prev => ({
      ...prev,
      lectures: prev.lectures.filter((_, i) => i !== lectureIndex)
    }))
  }

  const saveModule = () => {
    if (currentModule.title.trim()) {
      const moduleToSave = {
        ...currentModule,
        order: editingModuleIndex >= 0 ? editingModuleIndex : courseData.modules.length
      }

      if (editingModuleIndex >= 0) {
        // Edit existing module
        setCourseData(prev => ({
          ...prev,
          modules: prev.modules.map((module, index) => 
            index === editingModuleIndex ? moduleToSave : module
          )
        }))
      } else {
        // Add new module
        setCourseData(prev => ({
          ...prev,
          modules: [...prev.modules, moduleToSave]
        }))
      }

      // Reset module form
      setCurrentModule({
        title: '',
        description: '',
        lectures: []
      })
      setIsAddingModule(false)
      setEditingModuleIndex(-1)
    }
  }

  const editModule = (index) => {
    setCurrentModule(courseData.modules[index])
    setEditingModuleIndex(index)
    setIsAddingModule(true)
  }

  const removeModule = (index) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Debug: Log user object
    console.log('=== Create Course - User Debug ===')
    console.log('User object:', user)
    console.log('User ID (_id):', user?._id)
    console.log('User ID (id):', user?.id)
    console.log('User role:', user?.role)
    
    // Validate user is ready and is instructor or admin
    if (!user) {
      console.error('❌ No user object found')
      toast.error('You must be logged in to create courses')
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
      toast.error(`Only instructors can create courses. Your role: ${user.role}`)
      return
    }
    
    console.log('✅ User validation passed')
    
    // Validate required fields with specific messages
    if (!courseData.title || courseData.title.trim() === '') {
      toast.error('Course title is required')
      return
    }
    
    if (!courseData.description || courseData.description.trim() === '') {
      toast.error('Course description is required')
      return
    }
    
    if (!courseData.category || courseData.category.trim() === '') {
      toast.error('Course category is required')
      return
    }

    if (courseData.modules.length === 0) {
      toast.error('Please add at least one module')
      return
    }

    // Validate that each module has at least one lecture
    const hasEmptyModules = courseData.modules.some(module => module.lectures.length === 0)
    if (hasEmptyModules) {
      toast.error('Each module must have at least one lecture')
      return
    }

    // Validate that video lectures have URLs
    const hasInvalidVideoLectures = courseData.modules.some(module => 
      module.lectures.some(lecture => 
        lecture.type === 'video' && !lecture.videoUrl?.trim()
      )
    )
    if (hasInvalidVideoLectures) {
      toast.error('All video lectures must have a valid video URL')
      return
    }

    setLoading(true)
    try {
      // Upload thumbnail if provided
      let thumbnailUrl = null
      if (thumbnailFile) {
        console.log('Attempting to upload thumbnail...')
        thumbnailUrl = await uploadThumbnail()
        
        // If thumbnail upload fails, continue without it
        if (!thumbnailUrl) {
          console.log('Thumbnail upload failed, continuing without thumbnail')
          toast.warn('Course created without thumbnail. You can add one later.')
        }
      }

      // Clean the course data to remove any invalid ObjectId values
      const cleanCourseData = {
        ...courseData,
        thumbnail: thumbnailUrl || courseData.thumbnail || ''
      }

      // Remove any _id fields that might have been added accidentally
      delete cleanCourseData._id
      
      // Clean modules and lectures to remove invalid IDs
      if (cleanCourseData.modules) {
        cleanCourseData.modules = cleanCourseData.modules.map(module => {
          const cleanModule = { ...module }
          delete cleanModule._id
          
          if (cleanModule.lectures) {
            cleanModule.lectures = cleanModule.lectures.map(lecture => {
              const cleanLecture = { ...lecture }
              delete cleanLecture._id
              
              // Clean quiz questions to remove temporary IDs
              if (cleanLecture.quiz && cleanLecture.quiz.questions) {
                cleanLecture.quiz.questions = cleanLecture.quiz.questions.map(question => {
                  const cleanQuestion = { ...question }
                  delete cleanQuestion.id // Remove temporary ID added by Date.now()
                  return cleanQuestion
                })
              }
              
              return cleanLecture
            })
          }
          
          return cleanModule
        })
      }

      console.log('Creating course with cleaned data:', cleanCourseData)
      const { data } = await api.post('/courses', cleanCourseData)
      toast.success('Course created successfully!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Course creation error:', error)
      
      // Handle different types of errors
      if (error.response?.data?.errors) {
        // Multiple validation errors
        error.response.data.errors.forEach(err => toast.error(err))
      } else if (error.response?.data?.message) {
        // Single error message
        toast.error(error.response.data.message)
      } else if (error.message) {
        // Network or other errors
        toast.error(error.message)
      } else {
        // Fallback error
        toast.error('Failed to create course. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async () => {
    // Debug: Log user object
    console.log('=== Save Draft - User Debug ===')
    console.log('User object:', user)
    console.log('User ID (_id):', user?._id)
    console.log('User ID (id):', user?.id)
    console.log('User role:', user?.role)
    
    // Validate user is ready and is instructor or admin
    if (!user) {
      console.error('❌ No user object found')
      toast.error('You must be logged in to save courses')
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
      toast.error(`Only instructors can save courses. Your role: ${user.role}`)
      return
    }
    
    console.log('✅ Validation passed, proceeding with save...')

    setLoading(true)
    try {
      const draftData = { ...courseData, status: 'draft' }
      const { data } = await api.post('/courses', draftData)
      toast.success('Course saved as draft!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Draft save error:', error)
      toast.error(error.response?.data?.message || 'Failed to save draft')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while user data is being fetched
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error if user is not an instructor or admin
  if (user.role !== 'instructor' && user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Only instructors and administrators can create courses. Please contact an administrator if you need instructor access.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Current role: {user.role}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create New Course</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share your knowledge and create an engaging learning experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-primary-600" />
            Basic Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Course Title *</label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="input w-full"
                placeholder="Enter course title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input w-full"
                rows="4"
                placeholder="Describe what students will learn in this course"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={courseData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <select
                  value={courseData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className="input w-full"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Price ($)</label>
                <input
                  type="number"
                  value={courseData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="input w-full"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseData.isPremium}
                    onChange={(e) => handleInputChange('isPremium', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Premium Course</span>
                </label>
              </div>
            </div>

            {/* Course Thumbnail */}
            <div>
              <label className="block text-sm font-medium mb-2">Course Thumbnail</label>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a course thumbnail image (JPG, PNG, GIF)
                  </p>
                </div>
                {thumbnailPreview && (
                  <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Tags</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="input flex-1"
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="btn btn-outline"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {courseData.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-2 text-primary-500 hover:text-primary-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Requirements</h3>
          <div className="space-y-4">
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
              {courseData.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span>{req}</span>
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

        {/* What You Will Learn */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">What You Will Learn</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newLearningPoint}
                onChange={(e) => setNewLearningPoint(e.target.value)}
                className="input flex-1"
                placeholder="Add a learning outcome"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningPoint())}
              />
              <button
                type="button"
                onClick={addLearningPoint}
                className="btn btn-outline"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {courseData.whatYouWillLearn.map((point, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span>{point}</span>
                  <button
                    type="button"
                    onClick={() => removeLearningPoint(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Course Content</h3>
            <button
              type="button"
              onClick={() => setIsAddingModule(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </button>
          </div>

          {/* Modules List */}
          <div className="space-y-4">
            {courseData.modules.map((module, moduleIndex) => (
              <div key={moduleIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold">{module.title}</h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => editModule(moduleIndex)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeModule(moduleIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{module.description}</p>
                <div className="text-sm text-gray-500">
                  {module.lectures.length} lecture(s)
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Module Modal */}
          {isAddingModule && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold">
                    {editingModuleIndex >= 0 ? 'Edit Module' : 'Add Module'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingModule(false)
                      setEditingModuleIndex(-1)
                      setCurrentModule({ title: '', description: '', lectures: [] })
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Module Title *</label>
                    <input
                      type="text"
                      value={currentModule.title}
                      onChange={(e) => setCurrentModule(prev => ({ ...prev, title: e.target.value }))}
                      className="input w-full"
                      placeholder="Enter module title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Module Description</label>
                    <textarea
                      value={currentModule.description}
                      onChange={(e) => setCurrentModule(prev => ({ ...prev, description: e.target.value }))}
                      className="input w-full"
                      rows="3"
                      placeholder="Describe this module"
                    />
                  </div>

                  {/* Lectures */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-lg font-medium">Lectures</h5>
                      <button
                        type="button"
                        onClick={() => setIsAddingLecture(true)}
                        className="btn btn-outline btn-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Lecture
                      </button>
                    </div>

                    <div className="space-y-2">
                      {currentModule.lectures.map((lecture, lectureIndex) => (
                        <div key={lectureIndex} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <span className="font-medium">{lecture.title}</span>
                            <span className="ml-2 text-sm text-gray-500">({lecture.type})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLectureFromModule(lectureIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Lecture Form */}
                    {isAddingLecture && (
                      <div className="mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Lecture Title *</label>
                            <input
                              type="text"
                              value={currentLecture.title}
                              onChange={(e) => setCurrentLecture(prev => ({ ...prev, title: e.target.value }))}
                              className="input w-full"
                              placeholder="Enter lecture title"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Type</label>
                            <select
                              value={currentLecture.type}
                              onChange={(e) => setCurrentLecture(prev => ({ ...prev, type: e.target.value }))}
                              className="input w-full"
                            >
                              {lectureTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>

                          {currentLecture.type === 'video' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Upload Video File</label>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleVideoFileChange}
                                  className="input w-full"
                                  disabled={uploadingVideo}
                                />
                                {uploadingVideo && (
                                  <p className="text-sm text-blue-600 mt-1">Uploading video...</p>
                                )}
                                {currentLecture.videoUrl && (
                                  <p className="text-sm text-green-600 mt-1">Video uploaded successfully!</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Or Video URL</label>
                                <input
                                  type="url"
                                  value={currentLecture.videoUrl}
                                  onChange={(e) => setCurrentLecture(prev => ({ ...prev, videoUrl: e.target.value }))}
                                  className="input w-full"
                                  placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                                />
                              </div>
                            </div>
                          )}

                          {currentLecture.type === 'text' && (
                            <div>
                              <label className="block text-sm font-medium mb-2">Content</label>
                              <textarea
                                value={currentLecture.content}
                                onChange={(e) => setCurrentLecture(prev => ({ ...prev, content: e.target.value }))}
                                className="input w-full"
                                rows="4"
                                placeholder="Enter lecture content"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                            <input
                              type="number"
                              value={currentLecture.duration}
                              onChange={(e) => setCurrentLecture(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                              className="input w-full"
                              min="0"
                            />
                          </div>

                          {/* Quiz Section */}
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                              <h6 className="text-md font-medium">Module Test/Quiz</h6>
                              <button
                                type="button"
                                onClick={() => setIsAddingQuestion(true)}
                                className="btn btn-outline btn-sm"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Question
                              </button>
                            </div>

                            {/* Quiz Settings */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Passing Score (%)</label>
                                <input
                                  type="number"
                                  value={currentLecture.quiz.passingScore}
                                  onChange={(e) => setCurrentLecture(prev => ({
                                    ...prev,
                                    quiz: { ...prev.quiz, passingScore: parseInt(e.target.value) || 70 }
                                  }))}
                                  className="input w-full"
                                  min="0"
                                  max="100"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Time Limit (min)</label>
                                <input
                                  type="number"
                                  value={currentLecture.quiz.timeLimit}
                                  onChange={(e) => setCurrentLecture(prev => ({
                                    ...prev,
                                    quiz: { ...prev.quiz, timeLimit: parseInt(e.target.value) || 30 }
                                  }))}
                                  className="input w-full"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Max Attempts</label>
                                <input
                                  type="number"
                                  value={currentLecture.quiz.attempts}
                                  onChange={(e) => setCurrentLecture(prev => ({
                                    ...prev,
                                    quiz: { ...prev.quiz, attempts: parseInt(e.target.value) || 3 }
                                  }))}
                                  className="input w-full"
                                  min="1"
                                />
                              </div>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-2 mb-4">
                              {currentLecture.quiz.questions.map((question, questionIndex) => (
                                <div key={questionIndex} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{question.question}</p>
                                      <div className="mt-2 space-y-1">
                                        {question.options.map((option, optIndex) => (
                                          <div key={optIndex} className={`text-xs p-1 rounded ${optIndex === question.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {optIndex + 1}. {option} {optIndex === question.correctAnswer && '✓'}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeQuestionFromLecture(questionIndex)}
                                      className="text-red-500 hover:text-red-700 ml-2"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add Question Form */}
                            {isAddingQuestion && (
                              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg mb-4">
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Question *</label>
                                    <textarea
                                      value={currentQuestion.question}
                                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                                      className="input w-full"
                                      rows="2"
                                      placeholder="Enter your question"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-2">Answer Options *</label>
                                    {currentQuestion.options.map((option, index) => (
                                      <div key={index} className="flex items-center space-x-2 mb-2">
                                        <input
                                          type="radio"
                                          name="correctAnswer"
                                          checked={currentQuestion.correctAnswer === index}
                                          onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                                          className="text-primary-600"
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...currentQuestion.options]
                                            newOptions[index] = e.target.value
                                            setCurrentQuestion(prev => ({ ...prev, options: newOptions }))
                                          }}
                                          className="input flex-1"
                                          placeholder={`Option ${index + 1}`}
                                        />
                                      </div>
                                    ))}
                                    <p className="text-xs text-gray-500 mt-1">Select the radio button for the correct answer</p>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-2">Points</label>
                                    <input
                                      type="number"
                                      value={currentQuestion.points}
                                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                                      className="input w-full"
                                      min="1"
                                    />
                                  </div>

                                  <div className="flex space-x-2">
                                    <button
                                      type="button"
                                      onClick={addQuestionToLecture}
                                      className="btn btn-primary btn-sm"
                                    >
                                      Add Question
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setIsAddingQuestion(false)}
                                      className="btn btn-outline btn-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={addLectureToModule}
                              className="btn btn-primary btn-sm"
                            >
                              Add Lecture
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingLecture(false)}
                              className="btn btn-outline btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={saveModule}
                      className="btn btn-primary"
                    >
                      {editingModuleIndex >= 0 ? 'Update Module' : 'Add Module'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingModule(false)
                        setEditingModuleIndex(-1)
                        setCurrentModule({ title: '', description: '', lectures: [] })
                      }}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={loading}
            className="btn btn-outline"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="btn btn-secondary"
          >
            Preview Course
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>

        {/* Course Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Course Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Course Header */}
                <div className="border-b pb-6">
                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="Course thumbnail"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h1 className="text-3xl font-bold mb-2">{courseData.title || 'Course Title'}</h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{courseData.description || 'Course description'}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                      {courseData.category || 'Category'}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      {courseData.level}
                    </span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      ${courseData.price}
                    </span>
                  </div>
                </div>

                {/* What You'll Learn */}
                {courseData.whatYouWillLearn.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">What You'll Learn</h3>
                    <ul className="space-y-2">
                      {courseData.whatYouWillLearn.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements */}
                {courseData.requirements.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {courseData.requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Course Content */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Course Content</h3>
                  <div className="space-y-4">
                    {courseData.modules.map((module, moduleIndex) => (
                      <div key={moduleIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800">
                          <h4 className="font-semibold">{module.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {module.lectures.length} lecture(s)
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            {module.lectures.map((lecture, lectureIndex) => (
                              <div key={lectureIndex} className="flex items-center justify-between py-2">
                                <div className="flex items-center">
                                  {lecture.type === 'video' && <Video className="h-4 w-4 mr-2 text-blue-500" />}
                                  {lecture.type === 'text' && <FileText className="h-4 w-4 mr-2 text-green-500" />}
                                  {lecture.type === 'quiz' && <HelpCircle className="h-4 w-4 mr-2 text-purple-500" />}
                                  {lecture.type === 'assignment' && <Award className="h-4 w-4 mr-2 text-orange-500" />}
                                  <span className="text-sm">{lecture.title}</span>
                                </div>
                                {lecture.duration > 0 && (
                                  <span className="text-xs text-gray-500">{lecture.duration} min</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {courseData.tags.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {courseData.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default CreateCourse
