import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../utils/api'

const PortfolioDebug = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [debugInfo, setDebugInfo] = useState({})
  const [loading, setLoading] = useState(false)

  const testHealthCheck = async () => {
    try {
      setLoading(true)
      console.log('🔍 Testing portfolio health check...')
      
      const { data } = await api.get('/portfolios/health')
      console.log('✅ Health check response:', data)
      
      setDebugInfo(prev => ({
        ...prev,
        healthCheck: { success: true, data }
      }))
    } catch (error) {
      console.error('❌ Health check failed:', error)
      setDebugInfo(prev => ({
        ...prev,
        healthCheck: { success: false, error: error.response?.data || error.message }
      }))
    } finally {
      setLoading(false)
    }
  }

  const testPortfolioAPI = async () => {
    try {
      setLoading(true)
      console.log('🔍 Testing portfolio API...')
      
      const { data } = await api.get('/portfolios/my')
      console.log('✅ Portfolio API response:', data)
      
      setDebugInfo(prev => ({
        ...prev,
        portfolioAPI: { success: true, data }
      }))
    } catch (error) {
      console.error('❌ Portfolio API failed:', error)
      setDebugInfo(prev => ({
        ...prev,
        portfolioAPI: { success: false, error: error.response?.data || error.message }
      }))
    } finally {
      setLoading(false)
    }
  }

  const testPortfolioUpdate = async () => {
    try {
      setLoading(true)
      console.log('🔍 Testing portfolio update API...')
      
      const testData = {
        hero: {
          title: 'Test Portfolio Update',
          subtitle: 'Debug Test'
        }
      }
      
      const { data } = await api.put('/portfolios/my', testData)
      console.log('✅ Portfolio update response:', data)
      
      setDebugInfo(prev => ({
        ...prev,
        portfolioUpdate: { success: true, data }
      }))
    } catch (error) {
      console.error('❌ Portfolio update failed:', error)
      setDebugInfo(prev => ({
        ...prev,
        portfolioUpdate: { success: false, error: error.response?.data || error.message }
      }))
    } finally {
      setLoading(false)
    }
  }

  const testUserAPI = async () => {
    try {
      setLoading(true)
      console.log('🔍 Testing user API...')
      
      const { data } = await api.get('/users/profile')
      console.log('✅ User API response:', data)
      
      setDebugInfo(prev => ({
        ...prev,
        userAPI: { success: true, data }
      }))
    } catch (error) {
      console.error('❌ User API failed:', error)
      setDebugInfo(prev => ({
        ...prev,
        userAPI: { success: false, error: error.response?.data || error.message }
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Portfolio Debug Console</h1>
      
      {/* Auth Status */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <div className="space-y-2">
          <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p><strong>User ID:</strong> {user?._id || 'Not available'}</p>
          <p><strong>User Name:</strong> {user?.name || 'Not available'}</p>
          <p><strong>User Email:</strong> {user?.email || 'Not available'}</p>
          <p><strong>User Role:</strong> {user?.role || 'Not available'}</p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">API Tests</h2>
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={testHealthCheck}
            disabled={loading || !isAuthenticated}
            className="btn btn-primary"
          >
            Test Health Check
          </button>
          <button 
            onClick={testUserAPI}
            disabled={loading || !isAuthenticated}
            className="btn btn-secondary"
          >
            Test User API
          </button>
          <button 
            onClick={testPortfolioAPI}
            disabled={loading || !isAuthenticated}
            className="btn btn-accent"
          >
            Test Portfolio API
          </button>
          <button 
            onClick={testPortfolioUpdate}
            disabled={loading || !isAuthenticated}
            className="btn btn-warning"
          >
            Test Portfolio Update
          </button>
        </div>
        {loading && <p className="mt-4 text-blue-600">Testing...</p>}
      </div>

      {/* Results */}
      <div className="space-y-6">
        {debugInfo.healthCheck && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">
              Health Check {debugInfo.healthCheck.success ? '✅' : '❌'}
            </h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.healthCheck, null, 2)}
            </pre>
          </div>
        )}

        {debugInfo.userAPI && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">
              User API {debugInfo.userAPI.success ? '✅' : '❌'}
            </h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.userAPI, null, 2)}
            </pre>
          </div>
        )}

        {debugInfo.portfolioAPI && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">
              Portfolio API {debugInfo.portfolioAPI.success ? '✅' : '❌'}
            </h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.portfolioAPI, null, 2)}
            </pre>
          </div>
        )}

        {debugInfo.portfolioUpdate && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">
              Portfolio Update {debugInfo.portfolioUpdate.success ? '✅' : '❌'}
            </h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.portfolioUpdate, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card mt-8">
        <h3 className="text-lg font-semibold mb-3">Debug Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>First, ensure you are logged in (check Authentication Status above)</li>
          <li>Test Health Check to verify the portfolio system is working</li>
          <li>Test User API to ensure user data is accessible</li>
          <li>Test Portfolio API to see the actual error</li>
          <li>Check the browser console for detailed error logs</li>
          <li>Check the server console for backend error logs</li>
        </ol>
      </div>
    </div>
  )
}

export default PortfolioDebug
