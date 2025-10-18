import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

const initialState = {
  enrollments: [],
  currentEnrollment: null,
  loading: false,
  error: null,
}

export const fetchMyEnrollments = createAsyncThunk('enrollments/fetchMy', async () => {
  const { data } = await api.get('/enrollments/my')
  return data.enrollments
})

export const enrollCourse = createAsyncThunk('enrollments/enroll', async (courseId) => {
  const { data } = await api.post(`/enrollments/${courseId}`)
  return data.enrollment
})

export const updateProgress = createAsyncThunk('enrollments/updateProgress', async ({ enrollmentId, progressData }) => {
  const { data } = await api.put(`/enrollments/${enrollmentId}/progress`, progressData)
  return data.enrollment
})

export const unenrollCourse = createAsyncThunk('enrollments/unenroll', async (courseId) => {
  const { data } = await api.delete(`/enrollments/${courseId}`)
  return { courseId, success: data.success }
})

const enrollmentsSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.loading = false
        // Filter out dropped enrollments
        state.enrollments = action.payload.filter(enrollment => enrollment.status !== 'dropped')
      })
      .addCase(enrollCourse.fulfilled, (state, action) => {
        state.enrollments.unshift(action.payload)
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        const index = state.enrollments.findIndex(e => e._id === action.payload._id)
        if (index !== -1) {
          state.enrollments[index] = action.payload
        }
      })
      .addCase(unenrollCourse.fulfilled, (state, action) => {
        // Remove the unenrolled course from the enrollments array
        state.enrollments = state.enrollments.filter(
          enrollment => enrollment.course._id !== action.payload.courseId
        )
      })
  },
})

export default enrollmentsSlice.reducer
