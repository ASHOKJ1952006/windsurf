import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

const initialState = {
  jobs: [],
  loading: false,
  error: null,
}

export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async (params = {}) => {
  const { data } = await api.get('/jobs', { params })
  return data.jobs
})

export const applyJob = createAsyncThunk('jobs/apply', async (jobId) => {
  const { data } = await api.post(`/jobs/${jobId}/apply`)
  return data
})

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false
        state.jobs = action.payload
      })
  },
})

export default jobsSlice.reducer
