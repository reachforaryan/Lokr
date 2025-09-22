import React from 'react'
import { ChevronRightIcon, HomeIcon, FolderIcon } from '@heroicons/react/24/outline'
import { Folder } from './FolderTree'

interface BreadcrumbItem {
  id: string | null
  name: string
  folder?: Folder
}

interface BreadcrumbProps {
  currentFolder: Folder | null
  onNavigate: (folder: Folder | null) => void
  className?: string
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentFolder,
  onNavigate,
  className = ''
}) => {
  // Build breadcrumb path from current folder up to root
  const buildBreadcrumbPath = (folder: Folder | null): BreadcrumbItem[] => {
    if (!folder) {
      return [{ id: null, name: 'All Files' }]
    }

    const path: BreadcrumbItem[] = []
    let current: Folder | null = folder

    // Build path from current folder up to root
    while (current) {
      path.unshift({
        id: current.id,
        name: current.name,
        folder: current
      })

      // In a real implementation, you'd need to traverse up the parent chain
      // For now, we'll just stop at the current folder
      // TODO: Implement proper parent traversal when folder parent data is available
      current = null
    }

    // Add root at the beginning
    path.unshift({ id: null, name: 'All Files' })

    return path
  }

  const breadcrumbItems = buildBreadcrumbPath(currentFolder)

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          const isRoot = item.id === null

          return (
            <li key={item.id || 'root'} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
              )}

              <button
                onClick={() => onNavigate(item.folder || null)}
                className={`inline-flex items-center text-sm font-medium transition-colors ${
                  isLast
                    ? 'text-gray-700 cursor-default'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                disabled={isLast}
              >
                {isRoot ? (
                  <HomeIcon className="w-4 h-4 mr-1" />
                ) : (
                  <FolderIcon className="w-4 h-4 mr-1" />
                )}
                <span className={isLast ? 'text-gray-900' : ''}>{item.name}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Compact breadcrumb for mobile
export const CompactBreadcrumb: React.FC<BreadcrumbProps> = ({
  currentFolder,
  onNavigate,
  className = ''
}) => {
  const handleBackNavigation = () => {
    // In a real implementation, this would navigate to the parent folder
    // For now, navigate to root
    onNavigate(null)
  }

  return (
    <div className={`flex items-center ${className}`}>
      {currentFolder ? (
        <>
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mr-2"
          >
            <ChevronRightIcon className="w-4 h-4 rotate-180 mr-1" />
            Back
          </button>
          <div className="flex items-center">
            <FolderIcon className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-900 truncate">
              {currentFolder.name}
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center">
          <HomeIcon className="w-4 h-4 text-gray-600 mr-2" />
          <span className="text-sm font-medium text-gray-900">All Files</span>
        </div>
      )}
    </div>
  )
}