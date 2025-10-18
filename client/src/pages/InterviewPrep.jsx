import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Play, Square, Clock, Award, TrendingUp, BarChart3, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const InterviewPrep = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('practice')
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [timer, setTimer] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [feedback, setFeedback] = useState(null)
  
  const [sessionConfig, setSessionConfig] = useState({
    role: '',
    difficulty: 'medium',
    totalQuestions: 10,
    sessionType: 'practice'
  })

  useEffect(() => {
    fetchSessions()
    fetchAnalytics()
  }, [])

  useEffect(() => {
    let interval
    if (isRecording && currentSession) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, currentSession])

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/interviews/sessions')
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Fetch sessions error:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/interviews/analytics')
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Fetch analytics error:', error)
    }
  }

  const startNewSession = async () => {
    if (!sessionConfig.role) {
      toast.error('Please select a role')
      return
    }

    try {
      const { data } = await api.post('/interviews/sessions', sessionConfig)
      setCurrentSession(data.session)
      
      // Start the session
      const startResponse = await api.post(`/interviews/sessions/${data.session._id}/start`)
      setCurrentQuestion(startResponse.data.currentQuestion)
      setIsRecording(true)
      setTimer(0)
      
      toast.success('Interview session started!')
      setActiveTab('session')
    } catch (error) {
      console.error('Start session error:', error)
      toast.error('Failed to start session')
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer')
      return
    }

    setIsRecording(false)
    
    try {
      const { data } = await api.post(`/interviews/sessions/${currentSession._id}/answer`, {
        answer,
        duration: timer
      })

      setFeedback(data.feedback)
      
      if (data.isCompleted) {
        toast.success('Interview session completed!')
        setCurrentQuestion(null)
        fetchSessions()
        setActiveTab('results')
      } else {
        setCurrentQuestion(data.nextQuestion)
        setAnswer('')
        setTimer(0)
        setIsRecording(true)
        toast.success(`Question ${data.progress.current}/${data.progress.total} completed`)
      }
    } catch (error) {
      console.error('Submit answer error:', error)
      toast.error('Failed to submit answer')
      setIsRecording(true)
    }
  }

  const skipQuestion = () => {
    setAnswer('')
    setTimer(0)
    submitAnswer()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Interview Preparation</h1>
        <p className="text-gray-600 dark:text-gray-400">Practice with AI-powered mock interviews</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('practice')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'practice'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Practice
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'session'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
          disabled={!currentSession}
        >
          Active Session
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'analytics'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Practice Tab */}
      {activeTab === 'practice' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Start New Interview</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target Role</label>
                <select
                  value={sessionConfig.role}
                  onChange={(e) => setSessionConfig(prev => ({ ...prev, role: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">Select a role</option>
                  <option value="software-engineer">Software Engineer</option>
                  <option value="data-scientist">Data Scientist</option>
                  <option value="product-manager">Product Manager</option>
                  <option value="designer">Designer</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'medium', 'hard'].map(level => (
                    <button
                      key={level}
                      onClick={() => setSessionConfig(prev => ({ ...prev, difficulty: level }))}
                      className={`px-4 py-2 rounded-lg border ${
                        sessionConfig.difficulty === level
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900 text-primary-600'
                          : 'border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={sessionConfig.totalQuestions}
                  onChange={(e) => setSessionConfig(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) }))}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Session Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['practice', 'timed'].map(type => (
                    <button
                      key={type}
                      onClick={() => setSessionConfig(prev => ({ ...prev, sessionType: type }))}
                      className={`px-4 py-2 rounded-lg border ${
                        sessionConfig.sessionType === type
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900 text-primary-600'
                          : 'border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={startNewSession} className="btn btn-primary w-full mt-6">
                <Play className="h-5 w-5 mr-2" />
                Start Interview
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold mb-4">Your Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary-50 dark:bg-primary-900 rounded-lg">
                  <div className="text-3xl font-bold text-primary-600">
                    {analytics?.totalSessions || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {analytics?.averageScore || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Tips for Success</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Use the STAR method for behavioral questions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Include specific metrics and outcomes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Practice speaking clearly and confidently</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Keep answers concise (1-2 minutes)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Tab */}
      {activeTab === 'session' && currentSession && currentQuestion && (
        <div className="max-w-4xl mx-auto">
          <div className="card">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Question {currentSession.currentQuestionIndex + 1} of {currentSession.totalQuestions}
                </span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="font-mono">{formatTime(timer)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentSession.currentQuestionIndex + 1) / currentSession.totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="flex items-start space-x-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentQuestion.type === 'behavioral' ? 'bg-blue-100 text-blue-800' :
                  currentQuestion.type === 'technical' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {currentQuestion.type}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              
              <h2 className="text-2xl font-semibold mb-2">{currentQuestion.question}</h2>
              
              {currentQuestion.starStructure && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-semibold mb-2">💡 STAR Framework Tip:</p>
                  <ul className="text-sm space-y-1">
                    <li><strong>S</strong>ituation: Set the context</li>
                    <li><strong>T</strong>ask: Describe your responsibility</li>
                    <li><strong>A</strong>ction: Explain what you did</li>
                    <li><strong>R</strong>esult: Share the outcome</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Your Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="input w-full"
                rows="8"
                placeholder="Type your answer here... Aim for 50-300 words."
                disabled={!isRecording}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">{answer.split(/\s+/).filter(Boolean).length} words</span>
                {isRecording && (
                  <span className="flex items-center text-red-500 text-sm">
                    <span className="animate-pulse mr-2">●</span>
                    Recording...
                  </span>
                )}
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Feedback</h3>
                  <span className={`text-2xl font-bold ${getScoreColor(feedback.score)}`}>
                    {feedback.score}/100
                  </span>
                </div>
                
                {feedback.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-600 mb-1">✓ Strengths:</p>
                    <ul className="text-sm space-y-1">
                      {feedback.strengths.map((strength, i) => (
                        <li key={i} className="text-gray-700 dark:text-gray-300">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {feedback.improvements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">→ Improvements:</p>
                    <ul className="text-sm space-y-1">
                      {feedback.improvements.map((improvement, i) => (
                        <li key={i} className="text-gray-700 dark:text-gray-300">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={submitAnswer}
                disabled={!answer.trim() || !isRecording}
                className="btn btn-primary flex-1"
              >
                {currentSession.currentQuestionIndex + 1 === currentSession.totalQuestions ? 'Finish' : 'Next Question'}
              </button>
              <button onClick={skipQuestion} className="btn btn-outline">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {sessions.filter(s => s.status === 'completed').map((session) => (
            <div key={session._id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{session.role || 'General'} Interview</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      session.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{session.totalQuestions} questions</span>
                    <span>•</span>
                    <span>{new Date(session.completedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={getScoreColor(session.overallScore)}>
                      Score: {session.overallScore}/100
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/interviews/${session._id}`)}
                  className="btn btn-outline btn-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
          
          {sessions.filter(s => s.status === 'completed').length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No completed sessions yet</p>
              <button onClick={() => setActiveTab('practice')} className="btn btn-primary mt-4">
                Start Your First Interview
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <span>Average Score</span>
                <span className={`font-bold text-xl ${getScoreColor(analytics.averageScore)}`}>
                  {analytics.averageScore}/100
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <span>Total Sessions</span>
                <span className="font-bold text-xl">{analytics.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <span>Improvement</span>
                <span className={`font-bold text-xl ${analytics.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.improvement >= 0 ? '+' : ''}{analytics.improvement}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Strong & Weak Areas</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-2">✓ Strong Areas</h3>
                <div className="space-y-1">
                  {analytics.strongAreas.map((area, i) => (
                    <div key={i} className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded">
                      {area}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-orange-600 mb-2">→ Areas for Improvement</h3>
                <div className="space-y-1">
                  {analytics.weakAreas.map((area, i) => (
                    <div key={i} className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewPrep
