import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
  DocumentIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { useGetMyFilesQuery, useUploadFileMutation, FileVisibility } from '../generated/graphql'
import { FileShareModal } from '../components/FileShareModal'

export const Files: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isUploading, setIsUploading] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedFileForSharing, setSelectedFileForSharing] = useState<{
    id: string
    originalName: string
    filename: string
  } | null>(null)

  // Fetch real files from GraphQL
  const { data: filesData, loading, refetch } = useGetMyFilesQuery({
    variables: { limit: 100, offset: 0 }
  })
  const [uploadFileMutation] = useUploadFileMutation()

  const files = filesData?.myFiles || []

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = event.target.files
    if (!uploadFiles || uploadFiles.length === 0) return

    setIsUploading(true)
    toast.loading(`Uploading ${uploadFiles.length} file(s)...`)

    try {
      // Create FormData for multipart upload
      const formData = new FormData()
      Array.from(uploadFiles).forEach(file => {
        formData.append('files', file)
      })

      // Get JWT token from localStorage
      const token = localStorage.getItem('lokr_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Upload via REST API
      const response = await fetch('http://localhost:8080/api/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      toast.dismiss()
      toast.success(`Successfully uploaded ${result.files?.length || uploadFiles.length} file(s)`)

      // Refetch files to show the new uploads
      await refetch()

      // Clear the input
      event.target.value = ''
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.addEventListener('change', handleFileUpload as any)
    input.click()
  }

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('lokr_token')
      if (!token) {
        toast.error('Please log in to download files')
        return
      }

      const response = await fetch(`http://localhost:8080/api/v1/files/${fileId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Downloaded ${fileName}`)
    } catch (error: any) {
      toast.error(error.message || 'Download failed')
    }
  }

  const handleFilePreview = async (fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('lokr_token')
      if (!token) {
        toast.error('Please log in to preview files')
        return
      }

      const previewUrl = `http://localhost:8080/api/v1/files/${fileId}/preview?token=${encodeURIComponent(token)}`
      window.open(previewUrl, '_blank')
    } catch (error: any) {
      toast.error(error.message || 'Preview failed')
    }
  }

  const handleShare = (file: { id: string; originalName: string; filename: string }) => {
    setSelectedFileForSharing(file)
    setShareModalOpen(true)
  }

  const handleCloseShareModal = () => {
    setShareModalOpen(false)
    setSelectedFileForSharing(null)
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
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInHours < 48) return 'Yesterday'

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
  }

  const getFileIcon = (mimeType: string) => {
    // You can expand this to show different icons based on file type
    return <DocumentIcon className="h-12 w-12 text-gray-400" />
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

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Files</h1>
            <p className="mt-2 text-gray-600">
              Manage your secure file vault
            </p>
          </div>
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="btn-primary disabled:opacity-50"
          >
            <CloudArrowUpIcon className="w-5 h-5 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      )}

      {/* File Grid */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => (
            <div key={file.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg mb-4">
                  {getFileIcon(file.mimeType)}
                </div>
                <h3 className="font-semibold text-gray-900 truncate" title={file.originalName}>
                  {file.originalName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatFileSize(file.fileSize)} • {formatDate(file.uploadDate)}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    file.visibility === 'PRIVATE' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {file.visibility === 'PRIVATE' ? 'Private' : 'Shared'}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      className="btn-icon"
                      title="Share"
                      onClick={() => handleShare({ id: file.id, originalName: file.originalName, filename: file.filename })}
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="btn-icon"
                      title="Preview"
                      onClick={() => handleFilePreview(file.id, file.originalName)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="btn-icon"
                      title="Download"
                      onClick={() => handleFileDownload(file.id, file.originalName)}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button className="btn-icon text-red-600" title="Delete">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {!loading && viewMode === 'list' && (
        <div className="card">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentIcon className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900" title={file.originalName}>
                              {file.originalName}
                            </div>
                            <div className="text-sm text-gray-500">{getFileType(file.mimeType)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(file.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(file.uploadDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          file.visibility === 'PRIVATE' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {file.visibility === 'PRIVATE' ? 'Private' : 'Shared'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="btn-icon"
                            title="Share"
                            onClick={() => handleShare({ id: file.id, originalName: file.originalName, filename: file.filename })}
                          >
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="btn-icon"
                            title="Preview"
                            onClick={() => handleFilePreview(file.id, file.originalName)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="btn-icon"
                            title="Download"
                            onClick={() => handleFileDownload(file.id, file.originalName)}
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                          <button className="btn-icon text-red-600" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No files match your search' : 'No files yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms or upload new files.'
              : 'Get started by uploading your first file.'
            }
          </p>
          <div className="mt-6">
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="btn-primary disabled:opacity-50"
            >
              <CloudArrowUpIcon className="w-5 h-5 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      )}

      {/* File Share Modal */}
      {selectedFileForSharing && (
        <FileShareModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          file={selectedFileForSharing}
        />
      )}
    </div>
  )
}