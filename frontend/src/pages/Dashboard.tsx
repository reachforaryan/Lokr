import React, { useState } from 'react'
import { DocumentIcon, CloudArrowUpIcon, UsersIcon, ChartBarIcon, ShareIcon } from '@heroicons/react/24/outline'
import { useGetStorageStatsQuery, useGetMyFilesQuery, useGetSharedWithMeQuery, useUploadFileMutation, FileVisibility } from '../generated/graphql'
import toast from 'react-hot-toast'

export const Dashboard: React.FC = () => {
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Fetch real data from GraphQL
  const { data: storageStats, loading: statsLoading } = useGetStorageStatsQuery()
  const { data: filesData, loading: filesLoading } = useGetMyFilesQuery({ variables: { limit: 1000 } })
  const { data: sharedWithMeData, loading: sharedWithMeLoading } = useGetSharedWithMeQuery({ variables: { limit: 10 } })
  const [uploadFileMutation] = useUploadFileMutation()

  // Calculate shared files count from the files data
  const sharedFilesCount = filesData?.myFiles?.filter(file => file.visibility !== 'PRIVATE').length || 0
  const sharedWithMeCount = sharedWithMeData?.sharedWithMe?.length || 0

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = event.target.files
    if (!uploadFiles || uploadFiles.length === 0) return

    setUploadingFiles(true)
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

      // Clear the input
      event.target.value = ''
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.addEventListener('change', handleFileUpload as any)
    input.click()
  }

  const handleBrowseFiles = () => {
    window.location.href = '/files'
  }

  const handleShareFiles = () => {
    // For now, just show a toast - you could navigate to a sharing page
    toast('File sharing feature coming soon!')
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to Lokr - Your secure file vault
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filesLoading ? '...' : filesData?.myFiles?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CloudArrowUpIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : storageStats?.storageStats?.totalUsedFormatted || '0 MB'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShareIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Shared with Me</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sharedWithMeLoading ? '...' : sharedWithMeCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Storage Saved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : `${storageStats?.storageStats?.savingsPercentage?.toFixed(1) || 0}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={handleUploadClick}
              disabled={uploadingFiles}
              className="btn-primary disabled:opacity-50"
            >
              <CloudArrowUpIcon className="w-5 h-5 mr-2" />
              {uploadingFiles ? 'Uploading...' : 'Upload Files'}
            </button>
            <button onClick={handleBrowseFiles} className="btn-secondary">
              <DocumentIcon className="w-5 h-5 mr-2" />
              Browse Files
            </button>
            <button onClick={handleShareFiles} className="btn-outline">
              <UsersIcon className="w-5 h-5 mr-2" />
              Share Files
            </button>
          </div>
        </div>
      </div>

      {/* Shared with Me Files */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Files Shared with Me</h2>
            <ShareIcon className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="card-body">
          {sharedWithMeLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading shared files...</span>
            </div>
          ) : sharedWithMeData?.sharedWithMe && sharedWithMeData.sharedWithMe.length > 0 ? (
            <div className="space-y-3">
              {sharedWithMeData.sharedWithMe.slice(0, 5).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <DocumentIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Shared by {file.user?.name} • {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
              {sharedWithMeData.sharedWithMe.length > 5 && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => window.location.href = '/files?tab=shared'}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all {sharedWithMeData.sharedWithMe.length} shared files →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShareIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No files shared with you yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Files shared by other users will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}