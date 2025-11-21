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

export const upvotePost = createAsyncThunk('forum/upvotePost', async (postId) => {
  const { data } = await api.post(`/forums/${postId}/upvote`)
  return { postId, upvotes: data.upvotes }
})

// Fetch a post to increment views on the server and return updated post
export const incrementPostViews = createAsyncThunk('forum/incrementViews', async (postId) => {
  const { data } = await api.get(`/forums/${postId}`)
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
      .addCase(upvotePost.fulfilled, (state, action) => {
        const { postId, upvotes } = action.payload
        const p = state.posts.find(p => p._id === postId)
        if (p) {
          // Update upvotes count; server returns length
          if (Array.isArray(p.upvotes)) p.upvotes = new Array(upvotes).fill(0)
          else p.upvotes = new Array(upvotes).fill(0)
        }
        if (state.currentPost?._id === postId) {
          if (Array.isArray(state.currentPost.upvotes)) state.currentPost.upvotes = new Array(upvotes).fill(0)
          else state.currentPost.upvotes = new Array(upvotes).fill(0)
        }
      })
      .addCase(incrementPostViews.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.posts.findIndex(p => p._id === updated._id)
        if (idx !== -1) {
          state.posts[idx] = { ...state.posts[idx], views: updated.views }
        }
        if (state.currentPost?._id === updated._id) {
          state.currentPost.views = updated.views
        }
      })
  },
})

export default forumSlice.reducer
