import React, { useState } from 'react'
import { DocumentIcon, FolderIcon, Bars3Icon, XMarkIcon, CheckIcon, LinkIcon, TrashIcon, PlusIcon, EyeIcon, ArrowDownTrayIcon, ShareIcon, MagnifyingGlassIcon, CloudArrowUpIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  pointerWithin
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useGetMyFilesQuery, useGetSharedWithMeQuery, useGetFolderContentsQuery, useDeleteFolderMutation, useCreateFileReferenceMutation, useFolderReferencesQuery, useDeleteFileReferenceMutation, useDeleteFileMutation } from '../generated/graphql'
import { FolderTreeSimple, Folder } from '../components/FolderTreeSimple'
import { CreateFolderModal } from '../components/CreateFolderModal'
import { RenameFolderModal } from '../components/RenameFolderModal'
import { AddToFolderModal } from '../components/AddToFolderModal'
import { FileShareModal } from '../components/FileShareModal'
import toast from 'react-hot-toast'

interface FileItem {
  id: string
  originalName: string
  mimeType: string
  fileSize: number
  uploadDate: string
  folderId?: string | null
  user?: {
    id: string
    name: string
    email: string
  }
  isReference?: boolean
  referenceId?: string
  originalFile?: FileItem
}

interface DraggableFileCardProps {
  file: FileItem
  isSelected: boolean
  onSelect: (id: string, event: React.MouseEvent) => void
  formatFileSize: (bytes: number) => string
  formatDate: (dateString: string) => string
  onDeleteReference?: (referenceId: string) => void
  onAddToFolder?: (fileId: string, fileName: string) => void
  onPreview?: (file: FileItem) => void
  onDownload?: (file: FileItem) => void
  onShare?: (file: FileItem) => void
  onDelete?: (file: FileItem) => void
  viewMode?: 'grid' | 'list'
}

const DraggableFileCard: React.FC<DraggableFileCardProps> = ({
  file,
  isSelected,
  onSelect,
  formatFileSize,
  formatDate,
  onDeleteReference,
  onAddToFolder,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  viewMode = 'grid'
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: file.id,
    data: {
      type: 'file',
      file: file
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  if (viewMode === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          bg-white rounded-lg border hover:border-gray-300 hover:shadow-sm transition-all p-4 group flex items-center space-x-4
          ${isDragging ? 'opacity-50 z-50' : ''}
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'border-gray-200'}
          relative
        `}
      >
        {/* Selection Indicator */}
        <div className="flex-shrink-0">
          {isSelected ? (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <CheckIcon className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full group-hover:border-gray-400"></div>
          )}
        </div>

        {/* File Icon */}
        <div className="flex-shrink-0 relative">
          <DocumentIcon className="h-8 w-8 text-gray-400" />
          {file.isReference && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <LinkIcon className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* File Info - Click to select, drag handle on icon */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(file.id, e)
          }}
        >
          <div className="flex items-center space-x-3">
            {/* Drag Handle */}
            <div
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              title="Drag to move to folder"
            >
              <div className="w-2 h-4 flex flex-col justify-center space-y-1">
                <div className="w-full h-0.5 bg-gray-400 rounded"></div>
                <div className="w-full h-0.5 bg-gray-400 rounded"></div>
                <div className="w-full h-0.5 bg-gray-400 rounded"></div>
              </div>
            </div>

            {/* File Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate" title={file.originalName}>
                {file.originalName}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatFileSize(file.fileSize)}</span>
                <span>{formatDate(file.uploadDate)}</span>
                {file.isReference && (
                  <span className="text-blue-600 text-xs">📎 Shortcut</span>
                )}
                {file.user && (
                  <span className="text-xs text-gray-400">Shared by {file.user.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons - always visible in list view */}
        <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPreview(file)
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Preview"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDownload(file)
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Download"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          )}
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShare(file)
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Share"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          )}

          {/* Special buttons for references and folder operations */}
          {file.isReference && file.referenceId && onDeleteReference && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteReference(file.referenceId!)
              }}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Remove shortcut"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          {!file.isReference && onAddToFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToFolder(file.id, file.originalName)
              }}
              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Add to folder"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(file)
              }}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Grid view (original layout)
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg shadow hover:shadow-md transition-all p-6 group
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        relative
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <CheckIcon className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Delete Reference Button (only for references) */}
      {file.isReference && file.referenceId && onDeleteReference && !isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDeleteReference(file.referenceId!)
          }}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove shortcut"
        >
          <TrashIcon className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Add to Folder Button (only for original files, not references) */}
      {!file.isReference && onAddToFolder && !isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddToFolder(file.id, file.originalName)
          }}
          className="absolute top-2 right-8 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Add to folder"
        >
          <PlusIcon className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Drag Handle - File Icon Area */}
      <div
        {...listeners}
        {...attributes}
        className="flex items-center justify-center h-24 bg-gray-100 rounded-lg mb-4 relative cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-colors"
        title="Drag to move to folder"
      >
        <DocumentIcon className="h-12 w-12 text-gray-400" />
        {file.isReference && (
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <LinkIcon className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Clickable File Info Area */}
      <div
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          onSelect(file.id, e)
        }}
      >
        <h3 className="font-semibold text-gray-900 truncate" title={file.originalName}>
          {file.originalName}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {formatFileSize(file.fileSize)} • {formatDate(file.uploadDate)}
          {file.isReference && (
            <span className="text-blue-600 text-xs block mt-1">
              📎 Shortcut
            </span>
          )}
        </p>
        {file.user && (
          <p className="text-xs text-gray-400 mt-1">
            Shared by {file.user.name}
          </p>
        )}
      </div>

      {/* Action buttons - only show when not selected and not dragging */}
      {!isSelected && !isDragging && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(file)
                }}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Preview"
              >
                <EyeIcon className="h-4 w-4 text-gray-600" />
              </button>
            )}
            {onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload(file)
                }}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-4 w-4 text-gray-600" />
              </button>
            )}
            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(file)
                }}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Share"
              >
                <ShareIcon className="h-4 w-4 text-gray-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(file)
                }}
                className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4 text-red-600" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface DroppableFolderProps {
  folder: Folder | null
  children: React.ReactNode
  onDrop?: (fileIds: string[], folderId: string | null) => void
}

const DroppableFolder: React.FC<DroppableFolderProps> = ({ folder, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: folder ? `folder-${folder.id}` : 'root-folder',
    data: {
      type: 'folder',
      folder: folder
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        transition-colors duration-200
        ${isOver ? 'bg-green-50 border-2 border-green-400 border-dashed' : ''}
      `}
    >
      {children}
    </div>
  )
}

export const FilesEnhanced: React.FC = () => {
  const [viewType, setViewType] = useState<'all' | 'folder' | 'shared'>('all')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  // Folder-related state
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [parentFolderForCreation, setParentFolderForCreation] = useState<Folder | null>(null)
  const [renameFolderModalOpen, setRenameFolderModalOpen] = useState(false)
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null)

  // Add to folder modal state
  const [addToFolderModalOpen, setAddToFolderModalOpen] = useState(false)
  const [fileForFolderAdd, setFileForFolderAdd] = useState<{ id: string; name: string } | null>(null)

  // File sharing modal state
  const [fileShareModalOpen, setFileShareModalOpen] = useState(false)
  const [fileToShare, setFileToShare] = useState<FileItem | null>(null)

  // Fetch files from GraphQL
  const { data: filesData, loading, error } = useGetMyFilesQuery({
    variables: { limit: 100, offset: 0 }
  })

  // Fetch shared files
  const { data: sharedFilesData, loading: sharedLoading } = useGetSharedWithMeQuery()

  // Fetch folder contents when a folder is selected
  const { data: folderContentsData, loading: folderLoading } = useGetFolderContentsQuery({
    variables: { id: currentFolder?.id || '' },
    skip: !currentFolder
  })

  // Fetch folder references when a folder is selected
  const { data: folderReferencesData, loading: folderReferencesLoading } = useFolderReferencesQuery({
    variables: { folderId: currentFolder?.id || '' },
    skip: !currentFolder
  })

  // Delete folder mutation
  const [deleteFolderMutation] = useDeleteFolderMutation()

  // File reference mutations
  const [createFileReferenceMutation] = useCreateFileReferenceMutation()
  const [deleteFileReferenceMutation] = useDeleteFileReferenceMutation()

  // File operations
  const [deleteFileMutation] = useDeleteFileMutation()

  const myFiles = filesData?.myFiles || []
  const sharedFiles = sharedFilesData?.sharedWithMe || []
  const folderReferences = folderReferencesData?.folderReferences || []

  const getDisplayFiles = (): FileItem[] => {
    let files: FileItem[] = []

    if (viewType === 'shared') {
      files = sharedFiles.map(file => ({
        ...file,
        user: file.user || undefined
      }))
    } else if (currentFolder) {
      // Convert file references to FileItem format with reference indicators
      files = folderReferences.map(ref => ({
        id: ref.file?.id || '',
        originalName: ref.name || ref.file?.originalName || '',
        mimeType: ref.file?.mimeType || '',
        fileSize: ref.file?.fileSize || 0,
        uploadDate: ref.file?.uploadDate || '',
        folderId: ref.folderId,
        isReference: true,
        referenceId: ref.id,
        originalFile: ref.file ? {
          id: ref.file.id,
          originalName: ref.file.originalName,
          mimeType: ref.file.mimeType,
          fileSize: ref.file.fileSize,
          uploadDate: ref.file.uploadDate,
          folderId: null
        } : undefined
      }))
    } else {
      files = myFiles.filter(file => !file.folderId).map(file => ({
        ...file,
        user: file.user || undefined
      }))
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      files = files.filter(file =>
        file.originalName.toLowerCase().includes(searchLower) ||
        file.mimeType.toLowerCase().includes(searchLower)
      )
    }

    return files
  }

  const displayFiles = getDisplayFiles()

  // File selection handlers
  const handleFileSelect = (fileId: string, event: React.MouseEvent) => {
    // Prevent selection during drag operations
    if (isDragging) return
    // Prevent drag from interfering with selection
    if (event.detail === 0) return // Ignore programmatic clicks

    event.stopPropagation()

    const newSelected = new Set(selectedFiles)

    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId)
      } else {
        newSelected.add(fileId)
      }
    } else if (event.shiftKey && selectedFiles.size > 0) {
      // Range select with Shift
      const fileIds = displayFiles.map(f => f.id)
      const lastSelectedIndex = fileIds.findIndex(id => selectedFiles.has(id))
      const currentIndex = fileIds.findIndex(id => id === fileId)

      if (lastSelectedIndex !== -1) {
        const start = Math.min(lastSelectedIndex, currentIndex)
        const end = Math.max(lastSelectedIndex, currentIndex)

        for (let i = start; i <= end; i++) {
          newSelected.add(fileIds[i])
        }
      }
    } else {
      // Single select
      newSelected.clear()
      newSelected.add(fileId)
    }

    setSelectedFiles(newSelected)
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setDraggedFileId(active.id as string)
    setIsDragging(true)

    // If dragging a non-selected file, select only that file
    if (!selectedFiles.has(active.id as string)) {
      setSelectedFiles(new Set([active.id as string]))
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    console.log('🔄 Drag ended:', { active: active.id, over: over?.id, overData: over?.data.current })

    setDraggedFileId(null)
    setIsDragging(false)

    if (!over) {
      console.log('❌ No drop target found')
      return
    }

    // Get the files to move (selected files or just the dragged file)
    const filesToMove = selectedFiles.size > 0
      ? Array.from(selectedFiles)
      : [active.id as string]

    const overData = over.data.current
    console.log('📋 Drop target data:', overData)

    if (overData?.type === 'folder') {
      const targetFolder = overData.folder as Folder | null
      const targetFolderId = targetFolder?.id || null

      // Check if we're trying to move to the same directory
      const draggedFile = displayFiles.find(f => f.id === active.id as string)
      const currentFolderId = draggedFile?.folderId || null

      console.log('🔍 Same directory check:', { currentFolderId, targetFolderId })

      if (currentFolderId === targetFolderId) {
        console.log('⏸️ Same directory move prevented')
        return
      }

      console.log('✨ Triggering move operation')
      handleMoveFiles(filesToMove, targetFolderId)
    } else {
      console.log('❌ Invalid drop target type:', overData?.type)
    }
  }

  const handleMoveFiles = async (fileIds: string[], targetFolderId: string | null) => {
    // If no target folder, can't create references
    if (!targetFolderId) {
      console.log('❌ Cannot create references without target folder')
      return
    }

    try {
      console.log('🚀 Starting file reference creation:', { fileIds, targetFolderId })

      // Create file reference for each file individually
      for (const fileId of fileIds) {
        console.log(`🔗 Creating reference for file ${fileId} in folder ${targetFolderId}`)

        try {
          const result = await createFileReferenceMutation({
            variables: {
              input: {
                fileId: fileId,
                folderId: targetFolderId
              }
            },
            // Refetch queries to update the UI
            refetchQueries: [
              'GetMyFiles',
              'GetMyFolders',
              'GetFolderContents',
              'FolderReferences'
            ]
          })

          console.log(`✅ Successfully created reference for file ${fileId}:`, result)
        } catch (fileError: any) {
          console.error(`❌ Failed to create reference for file ${fileId}:`, fileError)
          throw fileError
        }
      }

      console.log('🎉 All file references created successfully')
      toast.success(`Created ${fileIds.length} shortcut${fileIds.length > 1 ? 's' : ''} successfully`)

      // Clear selection after operation
      setSelectedFiles(new Set())
    } catch (error: any) {
      console.error('💥 Reference creation failed:', error)
      toast.error(error.message || 'Failed to create shortcuts')
    }
  }

  // Utility functions
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
    clearSelection()
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

  const handleDeleteReference = async (referenceId: string) => {
    try {
      await deleteFileReferenceMutation({
        variables: { id: referenceId },
        refetchQueries: [
          'FolderReferences',
          'GetFolderContents'
        ]
      })
      toast.success('Shortcut removed successfully')
    } catch (error: any) {
      console.error('Failed to delete reference:', error)
      toast.error(error.message || 'Failed to remove shortcut')
    }
  }

  const handleAddToFolder = (fileId: string, fileName: string) => {
    setFileForFolderAdd({ id: fileId, name: fileName })
    setAddToFolderModalOpen(true)
  }

  const handlePreview = async (file: FileItem) => {
    try {
      const token = localStorage.getItem('lokr_token')
      if (!token) {
        toast.error('Please log in to preview files')
        return
      }

      const previewUrl = `http://localhost:8080/api/v1/files/${file.id}/preview?token=${encodeURIComponent(token)}`
      window.open(previewUrl, '_blank')
    } catch (error: any) {
      console.error('Error previewing file:', error)
      toast.error(error.message || 'Preview failed')
    }
  }

  const handleDownload = async (file: FileItem) => {
    try {
      const token = localStorage.getItem('lokr_token')
      if (!token) {
        toast.error('Please log in to download files')
        return
      }

      const response = await fetch(`http://localhost:8080/api/v1/files/${file.id}/download`, {
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
      a.download = file.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Downloaded ${file.originalName}`)
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error(error.message || 'Download failed')
    }
  }

  const handleShare = (file: FileItem) => {
    setFileToShare(file)
    setFileShareModalOpen(true)
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return
    }

    try {
      await deleteFileMutation({
        variables: { id: file.id },
        refetchQueries: [
          'GetMyFiles',
          'GetSharedWithMe',
          'GetFolderContents',
          'FolderReferences'
        ]
      })
      toast.success(`Deleted ${file.originalName}`)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete file')
    }
  }

  if (loading || sharedLoading || folderLoading || folderReferencesLoading) {
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

  const draggedFile = draggedFileId ? displayFiles.find(f => f.id === draggedFileId) : null

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex h-screen bg-gray-50" onClick={clearSelection}>
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r`}>
          <DroppableFolder folder={null} onDrop={handleMoveFiles}>
            <FolderTreeSimple
              onFolderSelect={handleFolderSelect}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              selectedFolderId={currentFolder?.id}
            />
          </DroppableFolder>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Sidebar Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSidebarOpen(!sidebarOpen)
                  }}
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
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {viewType === 'shared' ? 'Shared with me' :
                       currentFolder ? 'Folder contents' : 'All files'}
                    </span>
                    {selectedFiles.size > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                        {selectedFiles.size} selected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Search bar */}
              <div className="flex items-center space-x-4 flex-1 max-w-md">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* View Controls */}
              <div className="flex items-center space-x-4">
                {/* View Type Buttons */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewType('all')
                      setCurrentFolder(null)
                      clearSelection()
                    }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      viewType === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All Files
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewType('shared')
                      clearSelection()
                    }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      viewType === 'shared' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Shared
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewMode('grid')
                    }}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Grid view"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewMode('list')
                    }}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List view"
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Upload Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toast.success('File upload - Feature coming soon!')
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <DroppableFolder folder={currentFolder} onDrop={handleMoveFiles}>
            <div className="flex-1 overflow-auto p-6">
              {/* Files Grid/List */}
              {displayFiles.length === 0 ? (
                <div className="text-center py-16">
                  <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchTerm ? `No files found for "${searchTerm}"` :
                     viewType === 'shared' ? 'No shared files' :
                     currentFolder ? `No files in "${currentFolder.name}"` : 'No files yet'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms.' :
                     viewType === 'shared'
                      ? 'Files shared with you will appear here.'
                      : 'Get started by uploading your first file.'
                    }
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ?
                  "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" :
                  "space-y-2"
                }>
                  {displayFiles.map((file) => (
                    <DraggableFileCard
                      key={file.isReference ? `ref-${file.referenceId}` : file.id}
                      file={file}
                      isSelected={selectedFiles.has(file.id)}
                      onSelect={handleFileSelect}
                      formatFileSize={formatFileSize}
                      formatDate={formatDate}
                      onDeleteReference={handleDeleteReference}
                      onAddToFolder={handleAddToFolder}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                      onShare={handleShare}
                      onDelete={handleDelete}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </DroppableFolder>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedFile && (
            <div className="bg-white rounded-lg shadow-lg p-4 opacity-90">
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{draggedFile.originalName}</p>
                  {selectedFiles.size > 1 && (
                    <p className="text-sm text-gray-500">
                      +{selectedFiles.size - 1} more file{selectedFiles.size > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
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

      <AddToFolderModal
        isOpen={addToFolderModalOpen}
        onClose={() => {
          setAddToFolderModalOpen(false)
          setFileForFolderAdd(null)
        }}
        fileId={fileForFolderAdd?.id || ''}
        fileName={fileForFolderAdd?.name || ''}
      />

      {fileToShare && (
        <FileShareModal
          isOpen={fileShareModalOpen}
          onClose={() => {
            setFileShareModalOpen(false)
            setFileToShare(null)
          }}
          file={{
            id: fileToShare.id,
            originalName: fileToShare.originalName,
            filename: fileToShare.originalName // Use originalName as filename since that's what we have
          }}
        />
      )}
    </DndContext>
  )
}