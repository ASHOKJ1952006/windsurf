import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCourses } from '../store/slices/coursesSlice'
import { Search } from 'lucide-react'
import CourseCard from '../components/CourseCard'

const Courses = () => {
  const dispatch = useDispatch()
  const { courses, loading } = useSelector((state) => state.courses)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    sort: 'newest'
  })

  useEffect(() => {
    dispatch(fetchCourses(filters))
  }, [dispatch, filters])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Explore Courses</h1>

      {/* Filters */}
      <div className="card mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="input"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="Data Science">Data Science</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Design">Design</option>
          </select>
          <select
            className="input"
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            className="input"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-center py-12">Loading courses...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard 
              key={course._id} 
              course={course} 
              showEnrollmentStatus={true}
            />
          ))}
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No courses found. Try adjusting your filters.
        </div>
      )}
    </div>
  )
}

export default Courses
