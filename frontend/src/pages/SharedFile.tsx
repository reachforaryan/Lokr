import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface SharedFile {
  id: string
  originalName: string
  filename: string
  mimeType: string
  fileSize: number
  uploadDate: string
  downloadCount: number
}

export const SharedFile: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [file, setFile] = useState<SharedFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadSharedFile()
    }
  }, [token])

  const loadSharedFile = async () => {
    try {
      setLoading(true)

      // The backend returns file content directly, not JSON
      // Let's check if the token is valid by checking the response headers
      const response = await fetch(`http://localhost:8080/api/v1/shared/${token}`, {
        method: 'HEAD' // Just get headers to check if file exists
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('This shared file was not found or may have expired.')
        }
        throw new Error('Failed to load shared file')
      }

      // Extract file information from headers
      const contentDisposition = response.headers.get('Content-Disposition')
      const contentType = response.headers.get('Content-Type')
      const contentLength = response.headers.get('Content-Length')

      // Parse filename from Content-Disposition header
      let originalName = 'Unknown File'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          originalName = filenameMatch[1]
        }
      }

      // Create file object from available information
      const fileData: SharedFile = {
        id: token || '',
        originalName,
        filename: originalName,
        mimeType: contentType || 'application/octet-stream',
        fileSize: contentLength ? parseInt(contentLength, 10) : 0,
        uploadDate: new Date().toISOString(), // We don't have this from headers
        downloadCount: 0 // We don't have this from headers
      }

      setFile(fileData)
    } catch (error: any) {
      console.error('Error loading shared file:', error)
      setError(error.message || 'Failed to load shared file')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!file || !token) return

    try {
      setDownloading(true)

      // Use the same endpoint but trigger download by creating a download link
      const downloadUrl = `http://localhost:8080/api/v1/shared/${token}`

      // Create download link that will trigger the download
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = downloadUrl
      a.download = file.originalName
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success(`Downloaded ${file.originalName}`)
    } catch (error: any) {
      toast.error(error.message || 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = () => {
    if (!token) return

    const previewUrl = `http://localhost:8080/api/v1/shared/${token}/preview`
    window.open(previewUrl, '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getFileIcon = (mimeType: string) => {
    return <DocumentIcon className="h-20 w-20 text-gray-400" />
  }

  const getFileType = (mimeType: string) => {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'image/jpeg': 'Image',
      'image/png': 'Image',
      'image/gif': 'Image',
      'text/plain': 'Text',
      'application/json': 'JSON',
      'video/mp4': 'Video',
      'audio/mpeg': 'Audio',
    }
    return typeMap[mimeType] || 'File'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared file...</p>
        </div>
      </div>
    )
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">File Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'The shared file you are looking for does not exist or may have expired.'}
            </p>
            <a
              href="https://lokr.app"
              className="btn-primary inline-flex items-center"
            >
              Go to Lokr
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 text-center">
            <CloudArrowDownIcon className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Shared File</h1>
            <p className="text-blue-100 mt-2">Someone shared this file with you</p>
          </div>

          {/* File Details */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                {getFileIcon(file.mimeType)}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {file.originalName}
              </h2>

              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <DocumentIcon className="h-4 w-4 mr-1" />
                  {getFileType(file.mimeType)}
                </span>
                <span>{formatFileSize(file.fileSize)}</span>
                <span>Uploaded {formatDate(file.uploadDate)}</span>
              </div>

              {file.downloadCount > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Downloaded {file.downloadCount} time{file.downloadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handlePreview}
                className="btn-outline flex items-center"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                Preview
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary flex items-center disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-sm text-gray-500">
              Powered by{' '}
              <a href="https://lokr.app" className="text-blue-600 hover:text-blue-500">
                Lokr
              </a>{' '}
              - Secure file sharing
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}