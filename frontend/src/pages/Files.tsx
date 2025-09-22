import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
  DocumentIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useGetMyFilesQuery, useDeleteFolderMutation, useGetSharedWithMeQuery, useGetFolderContentsQuery } from '../generated/graphql'
import { FileShareModal } from '../components/FileShareModal'
import { FolderTree, Folder } from '../components/FolderTree'
import { Breadcrumb, CompactBreadcrumb } from '../components/Breadcrumb'
import { CreateFolderModal } from '../components/CreateFolderModal'
import { RenameFolderModal } from '../components/RenameFolderModal'
import { DragItem } from '../hooks/useDragAndDrop'

// Component for draggable file cards
interface DraggableFileCardProps {
  file: {
    id: string
    originalName: string
    mimeType: string
    fileSize: number
    uploadDate: string
  }
  getFileIcon: (mimeType: string) => JSX.Element
  formatFileSize: (bytes: number) => string
  formatDate: (dateString: string) => string
}

const DraggableFileCard: React.FC<DraggableFileCardProps> = ({
  file,
  getFileIcon,
  formatFileSize,
  formatDate
}) => {
  // Temporarily disable drag functionality to debug white screen
  // const dragItem: DragItem = {
  //   id: file.id,
  //   type: 'file',
  //   data: file
  // }

  // const dragProps = useDraggable(dragItem)

  return (
    <div className="card">
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
      </div>
    </div>
  )
}

export const Files: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [viewType, setViewType] = useState<'all' | 'folder' | 'shared'>('all')
  const [isUploading, setIsUploading] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedFileForSharing, setSelectedFileForSharing] = useState<{
    id: string
    originalName: string
    filename: string
  } | null>(null)

  // Folder-related state
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [parentFolderForCreation, setParentFolderForCreation] = useState<Folder | null>(null)
  const [renameFolderModalOpen, setRenameFolderModalOpen] = useState(false)
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null)

  // Fetch real files from GraphQL
  const { data: filesData, loading, refetch } = useGetMyFilesQuery({
    variables: { limit: 100, offset: 0 }
  })

  // Fetch shared files
  const { data: sharedFilesData, loading: sharedLoading } = useGetSharedWithMeQuery()

  // Fetch folder contents when a folder is selected
  const { data: folderContentsData, loading: folderLoading } = useGetFolderContentsQuery({
    variables: { id: currentFolder?.id || '' },
    skip: !currentFolder?.id
  })

  const [deleteFolderMutation] = useDeleteFolderMutation()

  const myFiles = filesData?.myFiles || []
  const sharedFiles = sharedFilesData?.sharedWithMe || []
  const folderFiles = folderContentsData?.folderContents?.files || []

  // Get files to display based on current view
  const getDisplayFiles = () => {
    if (viewType === 'shared') {
      return sharedFiles
    }

    if (currentFolder) {
      // Show files in the selected folder
      return folderFiles
    }

    // Show root files (files not in any folder)
    return myFiles.filter(file => !file.folderId)
  }

  const displayFiles = getDisplayFiles()

  // Temporarily disabled drag and drop
  // const gridDropProps = useDroppable(
  //   'file-grid',
  //   ['file'],
  //   (item) => handleFileDrop(item, currentFolder?.id)
  // )

  // const listDropProps = useDroppable(
  //   'file-list',
  //   ['file'],
  //   (item) => handleFileDrop(item, currentFolder?.id)
  // )

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

  // Folder management handlers
  const handleFolderSelect = (folder: Folder | null) => {
    setCurrentFolder(folder)
    setViewType('folder')
  }

  const handleViewAllFiles = () => {
    setCurrentFolder(null)
    setViewType('all')
  }

  const handleViewSharedFiles = () => {
    setCurrentFolder(null)
    setViewType('shared')
  }

  const handleCreateFolder = (parentId?: string) => {
    const parentFolder = parentId ? { id: parentId } as Folder : null
    setParentFolderForCreation(parentFolder)
    setCreateFolderModalOpen(true)
  }

  const handleFolderCreated = (folder: any) => {
    // Refresh the folder tree
    refetch()
    toast.success('Folder created successfully')
  }

  const handleRenameFolder = (folder: Folder) => {
    setFolderToRename(folder)
    setRenameFolderModalOpen(true)
  }

  const handleFolderRenamed = (folder: any) => {
    // Refresh the folder tree
    refetch()
    // Update current folder if it was renamed
    if (currentFolder?.id === folder.id) {
      setCurrentFolder({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      })
    }
  }

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Are you sure you want to delete the folder "${folder.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteFolderMutation({
        variables: {
          id: folder.id,
          force: false
        }
      })

      toast.success(`Folder "${folder.name}" deleted successfully`)

      // If the deleted folder was currently selected, go back to root
      if (currentFolder?.id === folder.id) {
        setCurrentFolder(null)
      }

      // Refresh the folder tree
      refetch()
    } catch (error: any) {
      console.error('Error deleting folder:', error)
      toast.error(error.message || 'Failed to delete folder')
    }
  }

  const handleFileDrop = async (item: DragItem, targetFolderId?: string) => {
    if (item.type !== 'file') return

    try {
      // We'll need to add the moveFile mutation later
      console.log('Moving file', item.id, 'to folder', targetFolderId)
      toast.success(`File moved successfully`)
      refetch()
    } catch (error: any) {
      console.error('Error moving file:', error)
      toast.error(error.message || 'Failed to move file')
    }
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

  // Temporarily disabled draggable components
  // const DraggableFileCard: React.FC<{ file: any }> = ({ file }) => {
  //   // Implementation commented out
  // }

  // const DraggableFileRow: React.FC<{ file: any }> = ({ file }) => {
  //   // Implementation commented out
  // }

  // Filter files based on search term
  const filteredFiles = displayFiles.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r`}>
        <FolderTree
          onFolderSelect={handleFolderSelect}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onFileDrop={handleFileDrop}
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
                className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
              >
                {sidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
              </button>

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">Files</h1>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1 rounded hover:bg-gray-100 hidden md:block"
                  >
                    <Bars3Icon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Breadcrumb - Desktop */}
                <div className="hidden md:block mt-2">
                  <Breadcrumb
                    currentFolder={currentFolder}
                    onNavigate={handleFolderSelect}
                  />
                </div>

                {/* Breadcrumb - Mobile */}
                <div className="md:hidden mt-2">
                  <CompactBreadcrumb
                    currentFolder={currentFolder}
                    onNavigate={handleFolderSelect}
                  />
                </div>
              </div>

              {/* View Type Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleViewAllFiles}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewType === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Files
                </button>
                <button
                  onClick={handleViewSharedFiles}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewType === 'shared' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Shared with Me
                </button>
              </div>
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

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">

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
      {(loading || sharedLoading || folderLoading) && (
        <div className="text-center py-12">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      )}

      {/* File Grid */}
      {!(loading || sharedLoading || folderLoading) && viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => (
            <DraggableFileCard
              key={file.id}
              file={file}
              getFileIcon={getFileIcon}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* File List */}
      {!(loading || sharedLoading || folderLoading) && viewMode === 'list' && (
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
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          File
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="btn-icon" title="Share">
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button className="btn-icon" title="Preview">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="btn-icon" title="Download">
                            <ArrowDownTrayIcon className="h-4 w-4" />
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
      {!(loading || sharedLoading || folderLoading) && filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No files match your search' :
             viewType === 'shared' ? 'No shared files' :
             currentFolder ? `No files in "${currentFolder.name}"` : 'No files yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms or upload new files.'
              : viewType === 'shared'
              ? 'Files shared with you will appear here.'
              : 'Get started by uploading your first file.'
            }
          </p>
          {viewType !== 'shared' && (
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
          )}
        </div>
      )}

        </div>
      </div>

      {/* Modals */}
      {selectedFileForSharing && (
        <FileShareModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          file={selectedFileForSharing}
        />
      )}

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