import { useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AuthTest = () => {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth)
  const [testResults, setTestResults] = useState({})
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const results = {}

    // Test 1: Check local storage
    results.localStorage = {
      token: !!localStorage.getItem('token'),
      refreshToken: !!localStorage.getItem('refreshToken'),
      tokenLength: localStorage.getItem('token')?.length || 0
    }

    // Test 2: Check Redux state
    results.reduxState = {
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      userId: user?._id || user?.id
    }

    // Test 3: Test auth/me endpoint
    try {
      const { data } = await api.get('/auth/me')
      results.authMe = {
        success: true,
        user: data.user
      }
    } catch (error) {
      results.authMe = {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      }
    }

    // Test 4: Test courses auth endpoint
    try {
      const { data } = await api.get('/courses/test-auth')
      results.coursesAuth = {
        success: true,
        data
      }
    } catch (error) {
      results.coursesAuth = {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      }
    }

    // Test 5: Test enrollments endpoint
    try {
      const { data } = await api.get('/enrollments/my')
      results.enrollments = {
        success: true,
        count: data.enrollments?.length || 0
      }
    } catch (error) {
      results.enrollments = {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      }
    }

    // Test 6: Test recommendations endpoint
    try {
      const { data } = await api.get('/recommendations')
      results.recommendations = {
        success: true,
        count: data.recommendations?.length || 0
      }
    } catch (error) {
      results.recommendations = {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      }
    }

    // Test 7: Test certificates endpoint
    try {
      const { data } = await api.get('/progress/certificates')
      results.certificates = {
        success: true,
        count: data.certificates?.length || 0
      }
    } catch (error) {
      results.certificates = {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      }
    }

    setTestResults(results)
    setTesting(false)
    
    const failedTests = Object.entries(results).filter(([key, value]) => value.success === false)
    if (failedTests.length > 0) {
      toast.error(`${failedTests.length} tests failed`)
    } else {
      toast.success('All tests passed!')
    }
  }

  const forceReLogin = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🔍 Authentication Test Dashboard</h1>
      
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Status</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>User Name:</strong> {user?.name || 'N/A'}
          </div>
          <div>
            <strong>User Role:</strong> {user?.role || 'N/A'}
          </div>
          <div>
            <strong>User ID:</strong> {user?._id || user?.id || 'N/A'}
          </div>
          <div>
            <strong>Token Present:</strong> {token ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>Token in Storage:</strong> {localStorage.getItem('token') ? '✅ Yes' : '❌ No'}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Run Tests</h2>
          <div className="space-x-2">
            <button
              onClick={runTests}
              disabled={testing}
              className="btn btn-primary"
            >
              {testing ? 'Testing...' : 'Run All Tests'}
            </button>
            <button
              onClick={forceReLogin}
              className="btn btn-outline"
            >
              Force Re-Login
            </button>
          </div>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h3>
                  <span className={result.success === false ? 'text-red-600' : 'text-green-600'}>
                    {result.success === false ? '❌ Failed' : '✅ Passed'}
                  </span>
                </div>
                <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Common Solutions</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>If token is missing: Click "Force Re-Login" button above</li>
          <li>If auth/me fails: Your token might be expired or invalid</li>
          <li>If role is wrong: Check with admin to verify your account role</li>
          <li>If specific endpoints fail: There might be a backend authorization issue</li>
          <li>Check browser console for detailed error messages</li>
        </ul>
      </div>
    </div>
  )
}

export default AuthTest
