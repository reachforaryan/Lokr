import React, { useState } from 'react'
import { XMarkIcon, FolderIcon } from '@heroicons/react/24/outline'
import { useGetMyFoldersQuery, useCreateFileReferenceMutation } from '../generated/graphql'
import toast from 'react-hot-toast'

interface Folder {
  id: string
  name: string
  parentId?: string | null
  children?: Folder[]
}

interface AddToFolderModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
}

export const AddToFolderModal: React.FC<AddToFolderModalProps> = ({
  isOpen,
  onClose,
  fileId,
  fileName
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const { data: foldersData, loading: foldersLoading } = useGetMyFoldersQuery()
  const [createFileReference, { loading: creatingReference }] = useCreateFileReferenceMutation()

  const folders = foldersData?.myFolders || []

  const handleAddToFolder = async () => {
    if (!selectedFolderId) {
      toast.error('Please select a folder')
      return
    }

    try {
      await createFileReference({
        variables: {
          input: {
            fileId,
            folderId: selectedFolderId
          }
        }
      })

      toast.success(`File "${fileName}" added to folder successfully!`)
      onClose()
    } catch (error) {
      console.error('Error adding file to folder:', error)
      toast.error('Failed to add file to folder')
    }
  }

  const renderFolderTree = (folderList: Folder[], level = 0) => {
    return folderList.map((folder) => (
      <div key={folder.id}>
        <div
          className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 rounded-lg ${
            selectedFolderId === folder.id ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => setSelectedFolderId(folder.id)}
        >
          <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-700">{folder.name}</span>
          {selectedFolderId === folder.id && (
            <div className="ml-auto">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          )}
        </div>
        {folder.children && folder.children.length > 0 && (
          <div>
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add to Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Select a folder to add "<span className="font-medium">{fileName}</span>" to:
            </p>
          </div>

          {foldersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-8">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500">No folders found</p>
              <p className="text-xs text-gray-400 mt-1">Create a folder first to organize your files</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {renderFolderTree(folders)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToFolder}
            disabled={!selectedFolderId || creatingReference}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingReference ? 'Adding...' : 'Add to Folder'}
          </button>
        </div>
      </div>
    </div>
  )
}