import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPosts, createPost } from '../store/slices/forumSlice'
import { MessageSquare, ThumbsUp, Eye, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const Forum = () => {
  const dispatch = useDispatch()
  const { posts, loading } = useSelector((state) => state.forum)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'question', tags: '' })

  useEffect(() => {
    dispatch(fetchPosts())
  }, [dispatch])

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please login to create a post')
      return
    }

    try {
      await dispatch(createPost({
        ...newPost,
        tags: newPost.tags.split(',').map(t => t.trim())
      })).unwrap()
      toast.success('Post created!')
      setShowCreateModal(false)
      setNewPost({ title: '', content: '', category: 'question', tags: '' })
    } catch (error) {
      toast.error('Failed to create post')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Community Forum</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Post
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">Loading posts...</div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={post.author?.profilePicture}
                    alt={post.author?.name}
                    className="h-10 w-10 rounded-full"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${post.author?.name}&background=random`
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold mb-2 hover:text-primary-600 cursor-pointer">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{post.author?.name}</span>
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded">
                      {post.category}
                    </span>
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {post.upvotes?.length || 0}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {post.answers?.length || 0}
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {post.views || 0}
                    </div>
                  </div>
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What's your question or topic?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  className="input"
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                >
                  <option value="question">Question</option>
                  <option value="discussion">Discussion</option>
                  <option value="help">Help</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  required
                  rows={6}
                  className="input"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Describe your question or topic in detail..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  className="input"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  placeholder="javascript, react, help"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Create Post
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Forum
