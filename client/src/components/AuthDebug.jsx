import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'

const AuthDebug = () => {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth)
  const [tokenFromStorage, setTokenFromStorage] = useState('')

  useEffect(() => {
    setTokenFromStorage(localStorage.getItem('token') || 'No token')
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Debug Info</h3>
      <div className="text-xs space-y-1">
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>User:</strong> {user ? user.name : 'null'}
        </div>
        <div>
          <strong>Role:</strong> {user?.role || 'N/A'}
        </div>
        <div>
          <strong>User ID:</strong> {user?._id || user?.id || 'N/A'}
        </div>
        <div>
          <strong>Token in Redux:</strong> {token ? '✅ Present' : '❌ Missing'}
        </div>
        <div>
          <strong>Token in Storage:</strong> {tokenFromStorage !== 'No token' ? '✅ Present' : '❌ Missing'}
        </div>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <strong>Token (first 20 chars):</strong>
          <div className="font-mono text-xs break-all">
            {tokenFromStorage.substring(0, 20)}...
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthDebug
