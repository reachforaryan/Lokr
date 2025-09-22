import React, { useState, useEffect } from 'react'
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useUpdateFolderMutation } from '../generated/graphql'
import { Folder } from './FolderTree'

interface RenameFolderModalProps {
  isOpen: boolean
  onClose: () => void
  folder: Folder | null
  onFolderRenamed: (folder: any) => void
}

export const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  onFolderRenamed
}) => {
  const [folderName, setFolderName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)

  const [updateFolderMutation] = useUpdateFolderMutation()

  // Set initial folder name when modal opens
  useEffect(() => {
    if (isOpen && folder) {
      setFolderName(folder.name)
    }
  }, [isOpen, folder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!folder) return

    if (!folderName.trim()) {
      toast.error('Please enter a folder name')
      return
    }

    if (folderName.trim() === folder.name) {
      // No change needed
      onClose()
      return
    }

    setIsRenaming(true)

    try {
      const result = await updateFolderMutation({
        variables: {
          id: folder.id,
          input: {
            name: folderName.trim()
          }
        }
      })

      if (result.data?.updateFolder) {
        toast.success(`Folder renamed to "${folderName}"`)
        onFolderRenamed(result.data.updateFolder)
        onClose()
      }
    } catch (error: any) {
      console.error('Error renaming folder:', error)
      toast.error(error.message || 'Failed to rename folder')
    } finally {
      setIsRenaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen || !folder) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <PencilIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Rename Folder</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isRenaming}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Current Folder Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Renaming: <strong className="text-gray-900">{folder.name}</strong>
              </p>
            </div>

            {/* New Folder Name Input */}
            <div>
              <label htmlFor="newFolderName" className="block text-sm font-medium text-gray-700 mb-2">
                New Folder Name
              </label>
              <input
                id="newFolderName"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter new folder name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
                disabled={isRenaming}
                autoFocus
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum 100 characters
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end mt-6 space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isRenaming}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRenaming || !folderName.trim() || folderName.trim() === folder.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isRenaming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Renaming...
                </>
              ) : (
                <>
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Rename Folder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}