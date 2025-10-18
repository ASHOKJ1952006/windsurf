import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

const initialState = {
  courses: [],
  currentCourse: null,
  recommendations: [],
  loading: false,
  error: null,
}

export const fetchCourses = createAsyncThunk('courses/fetchCourses', async (params = {}) => {
  const { data } = await api.get('/courses', { params })
  return data
})

export const fetchCourse = createAsyncThunk('courses/fetchCourse', async (id) => {
  const { data } = await api.get(`/courses/${id}`)
  return data.course
})

export const fetchRecommendations = createAsyncThunk('courses/fetchRecommendations', async () => {
  const { data } = await api.get('/recommendations')
  return data.recommendations
})

export const createCourse = createAsyncThunk('courses/createCourse', async (courseData) => {
  const { data } = await api.post('/courses', courseData)
  return data.course
})

export const updateCourse = createAsyncThunk('courses/updateCourse', async ({ id, courseData }) => {
  const { data } = await api.put(`/courses/${id}`, courseData)
  return data.course
})

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearCurrentCourse: (state) => {
      state.currentCourse = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false
        state.courses = action.payload.courses
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(fetchCourse.fulfilled, (state, action) => {
        state.currentCourse = action.payload
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.courses.unshift(action.payload)
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        const index = state.courses.findIndex(c => c._id === action.payload._id)
        if (index !== -1) {
          state.courses[index] = action.payload
        }
      })
  },
})

export const { clearCurrentCourse } = coursesSlice.actions
export default coursesSlice.reducer
