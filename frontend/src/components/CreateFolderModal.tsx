import React, { useState, useEffect } from 'react'
import { XMarkIcon, FolderPlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useCreateFolderMutation } from '../generated/graphql'
import { Folder } from './FolderTree'

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  parentFolder?: Folder | null
  onFolderCreated: (folder: any) => void
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  parentFolder,
  onFolderCreated
}) => {
  const [folderName, setFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [createFolderMutation] = useCreateFolderMutation()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFolderName('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!folderName.trim()) {
      toast.error('Please enter a folder name')
      return
    }

    setIsCreating(true)

    try {
      const result = await createFolderMutation({
        variables: {
          input: {
            name: folderName.trim(),
            parentId: parentFolder?.id || null
          }
        }
      })

      if (result.data?.createFolder) {
        toast.success(`Folder "${folderName}" created successfully`)
        onFolderCreated(result.data.createFolder)
        onClose()
      }
    } catch (error: any) {
      console.error('Error creating folder:', error)
      toast.error(error.message || 'Failed to create folder')
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FolderPlusIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Create New Folder</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isCreating}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Parent Folder Info */}
            {parentFolder && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Creating folder inside: <strong>{parentFolder.name}</strong>
                </p>
              </div>
            )}

            {/* Folder Name Input */}
            <div>
              <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
                Folder Name
              </label>
              <input
                id="folderName"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter folder name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
                disabled={isCreating}
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
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !folderName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlusIcon className="w-4 h-4 mr-2" />
                  Create Folder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}