import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  MessageCircle, 
  Users, 
  Search, 
  Send, 
  X, 
  Plus,
  User,
  Clock,
  ChevronLeft,
  MoreVertical
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import io from 'socket.io-client'

const Mentorships = () => {
  const { user } = useSelector((state) => state.auth)
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [availableMentors, setAvailableMentors] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (user) {
      fetchChats()
      fetchAvailableUsers()
      initializeSocket()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [user])

  const initializeSocket = () => {
    if (!user?.id) {
      console.log('User not available, skipping socket initialization')
      return
    }

    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000')
    
    newSocket.on('connect', () => {
      console.log('Connected to socket server')
      newSocket.emit('join-user-room', user.id)
    })

    newSocket.on('new-message', ({ chatId, message, chat }) => {
      if (selectedChat && selectedChat._id === chatId) {
        setMessages(prev => [...prev, message])
      }
      
      // Update chat list
      setChats(prev => {
        const updatedChats = prev.map(c => 
          c._id === chatId ? { ...c, lastMessage: chat.lastMessage } : c
        )
        return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      })
    })

    newSocket.on('user-typing', ({ userId, userName, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== userId), { userId, userName }])
      } else {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId))
      }
    })

    setSocket(newSocket)
  }

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/chats')
      setChats(data.chats || [])
    } catch (error) {
      console.error('Failed to fetch chats:', error)
      toast.error('Failed to load chats')
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      if (user.role === 'student') {
        const { data } = await api.get('/chats/mentors')
        setAvailableMentors(data.mentors || [])
      } else if (user.role === 'instructor' || user.role === 'admin') {
        const { data } = await api.get('/chats/students')
        setAvailableStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch available users:', error)
    }
  }

  const selectChat = async (chat) => {
    setSelectedChat(chat)
    setMessages([])
    
    try {
      const { data } = await api.get(`/chats/${chat._id}`)
      setMessages(data.chat.messages || [])
      
      if (socket) {
        socket.emit('join-chat', chat._id)
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const createNewChat = async (participantId) => {
    try {
      setLoading(true)
      const { data } = await api.post('/chats', { participantId })
      
      setChats(prev => [data.chat, ...prev])
      setShowNewChatModal(false)
      selectChat(data.chat)
      
      toast.success('Chat created successfully!')
    } catch (error) {
      console.error('Failed to create chat:', error)
      toast.error('Failed to create chat')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedChat) return

    try {
      const messageContent = newMessage.trim()
      setNewMessage('')
      
      // Optimistically add message to UI
      const tempMessage = {
        _id: Date.now(),
        sender: { _id: user.id, name: user.name, profilePicture: user.profilePicture },
        content: messageContent,
        createdAt: new Date(),
        isTemp: true
      }
      setMessages(prev => [...prev, tempMessage])

      const { data } = await api.post(`/chats/${selectedChat._id}/messages`, {
        content: messageContent
      })

      // Replace temp message with real message
      setMessages(prev => prev.map(msg => 
        msg.isTemp && msg._id === tempMessage._id ? data.message : msg
      ))

      // Update chat list
      setChats(prev => {
        const updatedChats = prev.map(c => 
          c._id === selectedChat._id ? { ...c, lastMessage: data.chat.lastMessage } : c
        )
        return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.isTemp))
    }
  }

  const handleTyping = (value) => {
    setNewMessage(value)
    
    if (socket && selectedChat) {
      if (value.trim() && !isTyping) {
        setIsTyping(true)
        socket.emit('typing', {
          chatId: selectedChat._id,
          userId: user.id,
          userName: user.name,
          isTyping: true
        })
      } else if (!value.trim() && isTyping) {
        setIsTyping(false)
        socket.emit('typing', {
          chatId: selectedChat._id,
          userId: user.id,
          userName: user.name,
          isTyping: false
        })
      }
    }
  }

  const filteredUsers = user?.role === 'student' 
    ? availableMentors.filter(mentor => 
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableStudents.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      )

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Mentorship & Chat</h1>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Chat
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to begin mentoring</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => {
                  const otherParticipant = chat.participants.find(p => p._id !== user.id)
                  return (
                    <div
                      key={chat._id}
                      onClick={() => selectChat(chat)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700 ${
                        selectedChat?._id === chat._id ? 'bg-primary-50 dark:bg-primary-900' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                          {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{otherParticipant?.name || 'Unknown'}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              otherParticipant?.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                              otherParticipant?.role === 'admin' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {otherParticipant?.role}
                            </span>
                          </div>
                          {chat.lastMessage && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {chat.lastMessage.content}
                            </p>
                          )}
                          {chat.lastMessage && (
                            <p className="text-xs text-gray-500">
                              {new Date(chat.lastMessage.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                    {selectedChat.participants.find(p => p._id !== user.id)?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedChat.participants.find(p => p._id !== user.id)?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedChat.participants.find(p => p._id !== user.id)?.role}
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isSender = message.sender._id === user.id
                  const senderRole = message.sender.role || 'user'
                  const roleLabel = senderRole === 'instructor' ? 'Instructor' : 'Student'
                  
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md`}>
                        {/* Sender Name & Role Badge */}
                        <div className={`flex items-center space-x-2 mb-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {isSender ? 'You' : message.sender.name}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            senderRole === 'instructor' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {roleLabel}
                          </span>
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`px-4 py-2 rounded-lg ${
                          isSender
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isSender ? 'text-primary-200' : 'text-gray-500'
                          }`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    className="input flex-1"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="btn btn-primary"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Select a conversation</p>
                <p>Choose a chat from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Start New Chat
              </h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                  placeholder={`Search ${user?.role === 'student' ? 'mentors' : 'students'}...`}
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No {user?.role === 'student' ? 'mentors' : 'students'} found
                </p>
              ) : (
                filteredUsers.map((person) => (
                  <div
                    key={person._id}
                    onClick={() => createNewChat(person._id)}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {person.role}
                      </p>
                      {person.instructorBio && (
                        <p className="text-xs text-gray-500 truncate">
                          {person.instructorBio}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Mentorships
