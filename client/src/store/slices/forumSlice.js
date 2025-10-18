import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

const initialState = {
  posts: [],
  currentPost: null,
  loading: false,
  error: null,
}

export const fetchPosts = createAsyncThunk('forum/fetchPosts', async (params = {}) => {
  const { data } = await api.get('/forums', { params })
  return data.posts
})

export const fetchPost = createAsyncThunk('forum/fetchPost', async (id) => {
  const { data } = await api.get(`/forums/${id}`)
  return data.post
})

export const createPost = createAsyncThunk('forum/createPost', async (postData) => {
  const { data } = await api.post('/forums', postData)
  return data.post
})

export const addAnswer = createAsyncThunk('forum/addAnswer', async ({ postId, content }) => {
  const { data } = await api.post(`/forums/${postId}/answers`, { content })
  return data.post
})

const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.currentPost = action.payload
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload)
      })
      .addCase(addAnswer.fulfilled, (state, action) => {
        state.currentPost = action.payload
      })
  },
})

export default forumSlice.reducer
