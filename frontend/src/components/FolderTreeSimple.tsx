import React, { useState } from 'react'
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useDroppable } from '@dnd-kit/core'
import { useGetMyFoldersQuery } from '../generated/graphql'

export interface Folder {
  id: string
  name: string
  parentId?: string | null
  children?: Folder[]
  files?: Array<{
    id: string
    filename: string
    originalName: string
  }>
  createdAt: string
  updatedAt: string
}

interface FolderTreeSimpleProps {
  onFolderSelect: (folder: Folder | null) => void
  onCreateFolder: (parentId?: string) => void
  onRenameFolder: (folder: Folder) => void
  onDeleteFolder: (folder: Folder) => void
  selectedFolderId?: string | null
}

interface FolderNodeProps {
  folder: Folder
  level: number
  onFolderSelect: (folder: Folder | null) => void
  onCreateFolder: (parentId?: string) => void
  onRenameFolder: (folder: Folder) => void
  onDeleteFolder: (folder: Folder) => void
  selectedFolderId?: string | null
  isExpanded: boolean
  onToggleExpand: () => void
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  level,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  selectedFolderId,
  isExpanded,
  onToggleExpand
}) => {
  const [showActions, setShowActions] = useState(false)
  const hasChildren = folder.children && folder.children.length > 0

  // Make folder droppable
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folder: folder
    }
  })

  return (
    <div>
      <div
        ref={setNodeRef}
        className={`flex items-center group hover:bg-gray-50 rounded-lg p-2 cursor-pointer border border-transparent ${
          selectedFolderId === folder.id ? 'bg-blue-50 border border-blue-200' : ''
        } ${
          isOver ? 'bg-green-50 border-green-200' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onFolderSelect(folder)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className={`mr-1 p-0.5 rounded hover:bg-gray-200 ${
            hasChildren ? '' : 'invisible'
          }`}
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Folder Icon */}
        {isExpanded ? (
          <FolderOpenIcon className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
        ) : (
          <FolderIcon className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
        )}

        {/* Folder Name */}
        <span className="text-sm font-medium text-gray-700 truncate flex-1">
          {folder.name}
        </span>

        {/* File Count Badge */}
        {folder.files && folder.files.length > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            {folder.files.length}
          </span>
        )}

        {/* Actions Menu */}
        {showActions && (
          <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateFolder(folder.id)
              }}
              className="p-1 rounded hover:bg-gray-200"
              title="Create subfolder"
            >
              <PlusIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRenameFolder(folder)
              }}
              className="p-1 rounded hover:bg-gray-200"
              title="Rename folder"
            >
              <PencilIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFolder(folder)
              }}
              className="p-1 rounded hover:bg-gray-200 text-red-500"
              title="Delete folder"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeNodeContainer
              key={child.id}
              folder={child}
              level={level + 1}
              onFolderSelect={onFolderSelect}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              selectedFolderId={selectedFolderId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Container component to manage expanded state
const FolderTreeNodeContainer: React.FC<{
  folder: Folder
  level: number
  onFolderSelect: (folder: Folder | null) => void
  onCreateFolder: (parentId?: string) => void
  onRenameFolder: (folder: Folder) => void
  onDeleteFolder: (folder: Folder) => void
  selectedFolderId?: string | null
}> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <FolderNode
      {...props}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
    />
  )
}

// Root folder droppable component
const RootFolderDroppable: React.FC<{
  selectedFolderId?: string | null
  onFolderSelect: (folder: Folder | null) => void
}> = ({ selectedFolderId, onFolderSelect }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'root-folder',
    data: {
      type: 'folder',
      folder: null
    }
  })

  return (
    <button
      ref={setNodeRef}
      onClick={() => onFolderSelect(null)}
      className={`w-full flex items-center p-2 rounded-lg text-left hover:bg-gray-50 border border-transparent ${
        selectedFolderId === null ? 'bg-blue-50 border border-blue-200' : ''
      } ${
        isOver ? 'bg-green-50 border-green-200' : ''
      }`}
    >
      <FolderIcon className="w-5 h-5 text-gray-600 mr-2" />
      <span className="text-sm font-medium text-gray-700">All Files</span>
    </button>
  )
}

export const FolderTreeSimple: React.FC<FolderTreeSimpleProps> = ({
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  selectedFolderId
}) => {
  const { data, loading, error } = useGetMyFoldersQuery()

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Failed to load folders</p>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  const folders = data?.myFolders || []

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Folders</h3>
        <button
          onClick={() => onCreateFolder()}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="Create new folder"
        >
          <PlusIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Root Level Button */}
      <div className="px-4 pt-2">
        <RootFolderDroppable
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
        />
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto px-2">
        {folders.length === 0 ? (
          <div className="text-center py-8">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No folders yet</p>
            <button
              onClick={() => onCreateFolder()}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Create your first folder
            </button>
          </div>
        ) : (
          <div className="py-2 space-y-1">
            {folders.map((folder) => (
              <FolderTreeNodeContainer
                key={folder.id}
                folder={folder}
                level={0}
                onFolderSelect={onFolderSelect}
                onCreateFolder={onCreateFolder}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                selectedFolderId={selectedFolderId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}