import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Star, Clock, Users, TrendingUp, Heart, Target, BookOpen, Filter } from 'lucide-react'
import { fetchRecommendations } from '../store/slices/coursesSlice'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Recommendations = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { recommendations } = useSelector((state) => state.courses)
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('personalized')
  const [collaborativeRecs, setCollaborativeRecs] = useState([])
  const [categoryRecs, setCategoryRecs] = useState([])
  const [interestFilter, setInterestFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchAllRecommendations()
    }
  }, [user, dispatch])

  const fetchAllRecommendations = async () => {
    try {
      setLoading(true)
      
      // Fetch main recommendations
      dispatch(fetchRecommendations())
      
      // Fetch additional recommendation data
      const { data } = await api.get('/recommendations')
      setCollaborativeRecs(data.collaborative || [])
      setCategoryRecs(data.categoryBased || [])
      
    } catch (error) {
      toast.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const fetchInterestBasedRecs = async (interest) => {
    try {
      const { data } = await api.get(`/recommendations/by-interest/${encodeURIComponent(interest)}`)
      return data.recommendations
    } catch (error) {
      console.error('Failed to fetch interest-based recommendations')
      return []
    }
  }

  const getFilteredRecommendations = () => {
    let filtered = recommendations || []
    
    if (interestFilter !== 'all') {
      filtered = filtered.filter(course => 
        course.tags?.some(tag => 
          tag.toLowerCase().includes(interestFilter.toLowerCase())
        ) || 
        course.category.toLowerCase().includes(interestFilter.toLowerCase())
      )
    }
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(course => course.level === levelFilter)
    }
    
    return filtered
  }

  const CourseCard = ({ course, showMatchScore = true, showReasons = true }) => (
    <Link to={`/courses/${course._id}`}>
      <div className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary-500">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">{course.title}</h3>
          {showMatchScore && course.score && (
            <div className="ml-3 flex flex-col items-end">
              <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 text-sm rounded-full font-medium">
                {Math.round(course.score * 100)}% match
              </span>
            </div>
          )}
        </div>
        
        <p className="mb-4 line-clamp-3 text-gray-800 dark:text-gray-200">{course.description}</p>
        
        {/* Match Reasons */}
        {showReasons && course.matchReasons && course.matchReasons.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-300">
              🎯 Why we recommend this:
            </p>
            <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-300">
              {course.matchReasons.slice(0, 2).map((reason, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Course Stats */}
        <div className="flex items-center text-sm mb-4 space-x-4 text-gray-800 dark:text-gray-200">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span>{course.averageRating?.toFixed(1)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.totalDuration}m</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{course.enrolledCount}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs font-medium">
              {course.category}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-800 dark:text-gray-200">
              {course.level}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            by {course.instructor?.name}
          </div>
        </div>
      </div>
    </Link>
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading personalized recommendations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Recommended for You</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Discover courses tailored to your interests, skills, and learning goals
        </p>
      </div>

      {/* User Interests Summary */}
      {user?.interests && user.interests.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center mb-4">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold">Your Interests</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {user.interests.map((interest, index) => (
              <button
                key={index}
                onClick={() => setInterestFilter(interestFilter === interest ? 'all' : interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  interestFilter === interest
                    ? 'bg-primary-600 text-white'
                    : 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Level:</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="input py-1 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {getFilteredRecommendations().length} courses found
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'personalized', name: 'Personalized', icon: Target },
              { id: 'collaborative', name: 'Similar Learners', icon: Users },
              { id: 'category', name: 'Related Courses', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'personalized' && (
          <div>
            {getFilteredRecommendations().length > 0 ? (
              <div className="grid gap-6">
                {getFilteredRecommendations().map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No recommendations found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your filters or add more interests to your profile
                </p>
                <Link to={`/profile/${user?._id}`} className="btn-primary">
                  Update Interests
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'collaborative' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">What Similar Learners Are Taking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Courses popular among students with similar interests to yours
              </p>
            </div>
            {collaborativeRecs.length > 0 ? (
              <div className="grid gap-6">
                {collaborativeRecs.map((course) => (
                  <CourseCard key={course._id} course={course} showMatchScore={false} showReasons={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No collaborative recommendations available yet
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'category' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">More in Your Favorite Categories</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Additional courses in categories you're interested in
              </p>
            </div>
            {categoryRecs.length > 0 ? (
              <div className="grid gap-6">
                {categoryRecs.map((course) => (
                  <CourseCard key={course._id} course={course} showMatchScore={false} showReasons={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No category-based recommendations available
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Recommendations
