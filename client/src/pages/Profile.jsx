import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Award, BookOpen, Star, TrendingUp, Settings, Heart, Target, Plus, X, Edit3, Camera, Phone, Globe, Linkedin, Github, Twitter } from 'lucide-react'
import { fetchRecommendations } from '../store/slices/coursesSlice'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Profile = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { recommendations } = useSelector((state) => state.courses)
  
  const [profileData, setProfileData] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: '',
    interests: [],
    goals: [],
    skills: [],
    wishlist: [],
    language: 'en',
    darkMode: false,
    emailNotifications: true,
    instructorBio: '',
    phone: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: ''
  })
  const [newInterest, setNewInterest] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [availableCourses, setAvailableCourses] = useState([])
  const [showCourseSelector, setShowCourseSelector] = useState(false)

  const predefinedInterests = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'AI', 'Cybersecurity', 'Cloud Computing', 'DevOps', 'UI/UX Design',
    'Digital Marketing', 'Business Analytics', 'Game Development', 'Blockchain'
  ]

  useEffect(() => {
    // Fetch data when we have a valid ID in URL or authenticated user
    const shouldFetch = (id && id !== 'undefined' && id !== 'null') || (!id && user?._id)
    
    if (shouldFetch) {
      fetchProfileData()
      fetchEnrollments()
      fetchAvailableCourses()
      if (user) {
        dispatch(fetchRecommendations())
      }
    }
  }, [id, user, dispatch])

  // Separate effect to handle user authentication changes
  useEffect(() => {
    if (user && !profileData && user._id) {
      fetchProfileData()
    }
  }, [user])

  const fetchProfileData = async () => {
    try {
      let apiUrl = '/users/profile'
      
      if (id) {
        // Viewing someone else's profile
        if (id === 'undefined' || id === 'null') {
          console.log('Invalid profile ID in URL')
          return
        }
        apiUrl = `/users/profile/${id}`
      } else {
        // Viewing own profile - use endpoint without ID
        if (!user?._id) {
          console.log('No user data available for own profile')
          return
        }
      }
      
      const { data } = await api.get(apiUrl)
      setProfileData(data.user)
      setEditForm({
        name: data.user.name || '',
        email: data.user.email || '',
        bio: data.user.bio || '',
        interests: data.user.interests || [],
        goals: data.user.goals || [],
        skills: data.user.skills || [],
        wishlist: data.user.wishlist || [],
        language: data.user.language || 'en',
        darkMode: data.user.darkMode || false,
        emailNotifications: data.user.emailNotifications !== undefined ? data.user.emailNotifications : true,
        instructorBio: data.user.instructorBio || '',
        phone: data.user.phone || '',
        website: data.user.website || '',
        linkedin: data.user.linkedin || '',
        github: data.user.github || '',
        twitter: data.user.twitter || ''
      })
    } catch (error) {
      console.error('Profile fetch error:', error)
      if (error.response?.status === 400) {
        toast.error('Invalid profile ID')
      } else if (error.response?.status === 404) {
        toast.error('Profile not found')
      } else {
        toast.error('Failed to fetch profile')
      }
    }
  }

  const fetchEnrollments = async () => {
    try {
      if (!user) {
        console.log('No user available for enrollments fetch')
        return
      }
      const { data } = await api.get('/enrollments/my')
      setEnrollments(data.enrollments)
    } catch (error) {
      console.error('Failed to fetch enrollments')
    }
  }

  const fetchAvailableCourses = async () => {
    try {
      const { data } = await api.get('/courses?limit=50')
      setAvailableCourses(data.courses)
    } catch (error) {
      console.error('Failed to fetch courses')
    }
  }

  const updateProfile = async () => {
    try {
      await api.put('/users/profile', editForm)
      toast.success('Profile updated successfully')
      setIsEditing(false)
      fetchProfileData()
      dispatch(fetchRecommendations()) // Refresh recommendations
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const addItem = (type, value) => {
    if (value.trim() && !editForm[type].includes(value.trim())) {
      setEditForm(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }))
    }
  }

  const removeItem = (type, index) => {
    setEditForm(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const addPredefinedInterest = (interest) => {
    if (!editForm.interests.includes(interest)) {
      setEditForm(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }))
    }
  }

  const toggleCourseWishlist = (course) => {
    const isInWishlist = editForm.wishlist.some(c => c._id === course._id)
    if (isInWishlist) {
      setEditForm(prev => ({
        ...prev,
        wishlist: prev.wishlist.filter(c => c._id !== course._id)
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        wishlist: [...prev.wishlist, course]
      }))
    }
  }

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Show loading state while waiting for user data or profile data
  if (!user && !id) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = !id || id === user?._id

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData.name?.charAt(0).toUpperCase()
                )}
              </div>
              {isOwnProfile && isEditing && (
                <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-3xl font-bold bg-transparent border-b-2 border-primary-300 focus:border-primary-500 outline-none"
                    placeholder="Your name"
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Your email"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                    rows="2"
                    placeholder="Tell us about yourself..."
                  />
                  {profileData.role === 'instructor' && (
                    <textarea
                      value={editForm.instructorBio}
                      onChange={(e) => handleInputChange('instructorBio', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                      rows="3"
                      placeholder="Instructor bio (professional background, expertise, etc.)"
                    />
                  )}
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2">{profileData.name}</h1>
                  {isOwnProfile && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{profileData.email}</p>
                  )}
                  {profileData.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{profileData.bio}</p>
                  )}
                  {profileData.role === 'instructor' && profileData.instructorBio && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Instructor Bio</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">{profileData.instructorBio}</p>
                    </div>
                  )}
                </>
              )}
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {profileData.role} • Level {profileData.level} • {profileData.xp} XP
              </p>
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{enrollments.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profileData.badges?.length || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Badges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profileData.streak?.current || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                </div>
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-outline"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interests Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              Interests
            </h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {predefinedInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => addPredefinedInterest(interest)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        editForm.interests.includes(interest)
                          ? 'bg-primary-100 border-primary-300 text-primary-700'
                          : 'border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add custom interest..."
                    className="input flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItem('interests', newInterest)
                        setNewInterest('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      addItem('interests', newInterest)
                      setNewInterest('')
                    }}
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.interests.map((interest, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700">
                      {interest}
                      <button
                        onClick={() => removeItem('interests', index)}
                        className="ml-2 text-primary-500 hover:text-primary-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileData.interests?.length > 0 ? (
                  profileData.interests.map((interest, index) => (
                    <span key={index} className="px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700">
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No interests added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Goals Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-500" />
              Learning Goals
            </h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a learning goal..."
                    className="input flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItem('goals', newGoal)
                        setNewGoal('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      addItem('goals', newGoal)
                      setNewGoal('')
                    }}
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.goals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span>{goal}</span>
                      <button
                        onClick={() => removeItem('goals', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {profileData.goals?.length > 0 ? (
                  profileData.goals.map((goal, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {goal}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No goals set yet</p>
                )}
              </div>
            )}
          </div>

          {/* Interested Courses */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
              Interested Courses
            </h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select courses you're interested in learning
                  </p>
                  <button
                    onClick={() => setShowCourseSelector(!showCourseSelector)}
                    className="btn btn-outline btn-sm"
                  >
                    {showCourseSelector ? 'Hide Courses' : 'Browse Courses'}
                  </button>
                </div>
                
                {showCourseSelector && (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="grid gap-3">
                      {availableCourses.map((course) => {
                        const isSelected = editForm.wishlist.some(c => c._id === course._id)
                        return (
                          <div
                            key={course._id}
                            onClick={() => toggleCourseWishlist(course)}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{course.title}</h4>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    {course.category}
                                  </span>
                                  <span className="ml-2">{course.level}</span>
                                  <Star className="h-3 w-3 ml-2 mr-1 text-yellow-500" />
                                  <span>{course.averageRating?.toFixed(1)}</span>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                              }`}>
                                {isSelected && <span className="text-white text-xs">✓</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium">Selected Courses ({editForm.wishlist.length})</p>
                  {editForm.wishlist.length > 0 ? (
                    <div className="grid gap-2">
                      {editForm.wishlist.map((course, index) => (
                        <div key={course._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{course.title}</h4>
                            <p className="text-xs text-gray-500">{course.category}</p>
                          </div>
                          <button
                            onClick={() => toggleCourseWishlist(course)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No courses selected yet</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {profileData.wishlist?.length > 0 ? (
                  <div className="grid gap-3">
                    {profileData.wishlist.map((course) => (
                      <div key={course._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{course.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {course.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded">
                                {course.category}
                              </span>
                              <span className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {course.level}
                              </span>
                              <Star className="h-3 w-3 ml-2 mr-1 text-yellow-500" />
                              <span>{course.averageRating?.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No interested courses selected yet</p>
                )}
              </div>
            )}
          </div>

          {/* Enrolled Courses */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Enrolled Courses
            </h2>
            {enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.slice(0, 3).map((enrollment) => (
                  <div key={enrollment._id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{enrollment.course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Progress: {enrollment.completionPercentage}%
                      </p>
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${enrollment.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No courses enrolled yet</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skills */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Skills
            </h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    className="input flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItem('skills', newSkill)
                        setNewSkill('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      addItem('skills', newSkill)
                      setNewSkill('')
                    }}
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                      {skill}
                      <button
                        onClick={() => removeItem('skills', index)}
                        className="ml-2 text-yellow-500 hover:text-yellow-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileData.skills?.length > 0 ? (
                  profileData.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Recommended Courses */}
          {isOwnProfile && recommendations?.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                Recommended for You
              </h2>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((course) => (
                  <div key={course._id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 transition-colors">
                    <h3 className="font-medium text-sm mb-1">{course.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{course.category}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {course.averageRating}
                      </div>
                      <span className="text-xs text-primary-600">{course.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-blue-500" />
              Contact Information
            </h2>
            {isEditing && isOwnProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={editForm.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GitHub</label>
                  <input
                    type="url"
                    value={editForm.github}
                    onChange={(e) => handleInputChange('github', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Twitter</label>
                  <input
                    type="url"
                    value={editForm.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {profileData.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="text-sm font-medium">{profileData.phone}</span>
                  </div>
                )}
                {profileData.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-3 text-gray-500" />
                    <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      {profileData.website}
                    </a>
                  </div>
                )}
                {profileData.linkedin && (
                  <div className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-3 text-blue-600" />
                    <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {profileData.github && (
                  <div className="flex items-center">
                    <Github className="h-4 w-4 mr-3 text-gray-800 dark:text-gray-200" />
                    <a href={profileData.github} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      GitHub Profile
                    </a>
                  </div>
                )}
                {profileData.twitter && (
                  <div className="flex items-center">
                    <Twitter className="h-4 w-4 mr-3 text-blue-400" />
                    <a href={profileData.twitter} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      Twitter Profile
                    </a>
                  </div>
                )}
                {!profileData.phone && !profileData.website && !profileData.linkedin && !profileData.github && !profileData.twitter && (
                  <p className="text-gray-500 text-sm">No contact information added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Preferences */}
          {isOwnProfile && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-500" />
                Preferences
              </h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      value={editForm.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dark Mode</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.darkMode}
                        onChange={(e) => handleInputChange('darkMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.emailNotifications}
                        onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Language:</span>
                    <span className="text-sm font-medium">{profileData.language?.toUpperCase() || 'EN'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dark Mode:</span>
                    <span className="text-sm font-medium">{profileData.darkMode ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email Notifications:</span>
                    <span className="text-sm font-medium">{profileData.emailNotifications ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Badges */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-500" />
              Badges & Achievements
            </h2>
            {profileData.badges?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {profileData.badges.map((badge, index) => (
                  <div key={index} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-medium">{badge.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No badges earned yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={updateProfile}
            className="btn btn-primary btn-lg shadow-lg"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}

export default Profile
