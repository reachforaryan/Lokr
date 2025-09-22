import React, { useState } from 'react'
import { DocumentIcon, CloudArrowUpIcon, FolderIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useGetMyFilesQuery, useGetSharedWithMeQuery, useGetFolderContentsQuery, useDeleteFolderMutation } from '../generated/graphql'
import { FolderTreeSimple, Folder } from '../components/FolderTreeSimple'
import { CreateFolderModal } from '../components/CreateFolderModal'
import { RenameFolderModal } from '../components/RenameFolderModal'
import toast from 'react-hot-toast'

export const FilesMinimal: React.FC = () => {
  const [viewType, setViewType] = useState<'all' | 'folder' | 'shared'>('all')

  // Folder-related state
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [parentFolderForCreation, setParentFolderForCreation] = useState<Folder | null>(null)
  const [renameFolderModalOpen, setRenameFolderModalOpen] = useState(false)
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null)

  // Fetch files from GraphQL
  const { data: filesData, loading, error } = useGetMyFilesQuery({
    variables: { limit: 100, offset: 0 }
  })

  // Fetch shared files
  const { data: sharedFilesData, loading: sharedLoading } = useGetSharedWithMeQuery()

  // Fetch folder contents when a folder is selected
  const { data: folderContentsData, loading: folderLoading } = useGetFolderContentsQuery({
    variables: { folderId: currentFolder?.id || '' },
    skip: !currentFolder
  })

  // Delete folder mutation
  const [deleteFolderMutation] = useDeleteFolderMutation()

  const myFiles = filesData?.myFiles || []
  const sharedFiles = sharedFilesData?.sharedWithMe || []
  const folderFiles = folderContentsData?.folderContents || []

  const getDisplayFiles = () => {
    if (viewType === 'shared') {
      return sharedFiles
    }
    if (currentFolder) {
      return folderFiles
    }
    return myFiles.filter(file => !file.folderId)
  }

  const displayFiles = getDisplayFiles()

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

  // Folder management handlers
  const handleFolderSelect = (folder: Folder | null) => {
    setCurrentFolder(folder)
    setViewType(folder ? 'folder' : 'all')
  }

  const handleCreateFolder = (parentId?: string) => {
    const parentFolder = parentId ? { id: parentId, name: '', parentId: null, createdAt: '', updatedAt: '' } : null
    setParentFolderForCreation(parentFolder)
    setCreateFolderModalOpen(true)
  }

  const handleRenameFolder = (folder: Folder) => {
    setFolderToRename(folder)
    setRenameFolderModalOpen(true)
  }

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      return
    }

    try {
      await deleteFolderMutation({
        variables: { id: folder.id, force: false }
      })
      toast.success(`Folder "${folder.name}" deleted successfully`)
      if (currentFolder?.id === folder.id) {
        setCurrentFolder(null)
        setViewType('all')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete folder')
    }
  }

  const handleFolderCreated = () => {
    // Folder tree will automatically refresh via GraphQL cache
  }

  const handleFolderRenamed = () => {
    // Folder tree will automatically refresh via GraphQL cache
  }

  if (loading || sharedLoading || folderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading files: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r`}>
        <FolderTreeSimple
          onFolderSelect={handleFolderSelect}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          selectedFolderId={currentFolder?.id}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <Bars3Icon className="w-5 h-5 text-gray-500" />
                )}
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentFolder ? currentFolder.name : 'Files'}
                </h1>
                <p className="text-sm text-gray-500">
                  {viewType === 'shared' ? 'Shared with me' :
                   currentFolder ? 'Folder contents' : 'All files'}
                </p>
              </div>
            </div>

            {/* View Type Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setViewType('all')
                  setCurrentFolder(null)
                }}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewType === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Files
              </button>
              <button
                onClick={() => setViewType('shared')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewType === 'shared' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Shared with Me
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Files Grid */}
          {displayFiles.length === 0 ? (
            <div className="text-center py-16">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {viewType === 'shared' ? 'No shared files' :
                 currentFolder ? `No files in "${currentFolder.name}"` : 'No files yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {viewType === 'shared'
                  ? 'Files shared with you will appear here.'
                  : 'Get started by uploading your first file.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayFiles.map((file) => (
                <div key={file.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                  <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg mb-4">
                    <DocumentIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate" title={file.originalName}>
                    {file.originalName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFileSize(file.fileSize)} • {formatDate(file.uploadDate)}
                  </p>
                  {file.user && viewType === 'shared' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Shared by {file.user.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => {
          setCreateFolderModalOpen(false)
          setParentFolderForCreation(null)
        }}
        parentFolder={parentFolderForCreation}
        onFolderCreated={handleFolderCreated}
      />

      <RenameFolderModal
        isOpen={renameFolderModalOpen}
        onClose={() => {
          setRenameFolderModalOpen(false)
          setFolderToRename(null)
        }}
        folder={folderToRename}
        onFolderRenamed={handleFolderRenamed}
      />
    </div>
  )
}