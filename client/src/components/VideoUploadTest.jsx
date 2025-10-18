import { useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const VideoUploadTest = () => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  const testConnection = async () => {
    try {
      const { data } = await api.post('/courses/test-upload')
      toast.success('Connection test successful!')
      setResult(data)
    } catch (error) {
      console.error('Connection test failed:', error)
      toast.error('Connection test failed')
      setResult({ error: error.message })
    }
  }

  const testVideoEndpoint = async () => {
    try {
      const { data } = await api.post('/courses/test-video-upload', { test: 'data' })
      toast.success('Video endpoint test successful!')
      setResult(data)
    } catch (error) {
      console.error('Video endpoint test failed:', error)
      toast.error('Video endpoint test failed')
      setResult({ error: error.message })
    }
  }

  const handleFileUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('video', file)

      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      const { data } = await api.post('/courses/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${percentCompleted}%`)
        }
      })

      toast.success('Upload successful!')
      setResult(data)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed: ' + (error.response?.data?.message || error.message))
      setResult({ 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Video Upload Test</h3>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testConnection}
            className="btn btn-outline mr-2"
          >
            Test Connection
          </button>
          <button
            onClick={testVideoEndpoint}
            className="btn btn-outline"
          >
            Test Video Endpoint
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Video File
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {file && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <button
          onClick={handleFileUpload}
          disabled={!file || uploading}
          className="btn btn-primary"
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoUploadTest
