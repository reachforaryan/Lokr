import React, { useState } from 'react'
import {
  DocumentIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export const Files: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mock file data
  const files = [
    {
      id: 1,
      name: 'Document.pdf',
      size: '2.4 MB',
      type: 'PDF',
      modified: '2 hours ago',
      shared: false,
    },
    {
      id: 2,
      name: 'Image.jpg',
      size: '1.2 MB',
      type: 'Image',
      modified: '1 day ago',
      shared: true,
    },
    {
      id: 3,
      name: 'Presentation.pptx',
      size: '5.8 MB',
      type: 'PowerPoint',
      modified: '3 days ago',
      shared: false,
    },
  ]

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
          <button className="btn-primary">
            <CloudArrowUpIcon className="w-5 h-5 mr-2" />
            Upload Files
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

      {/* File Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => (
            <div key={file.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg mb-4">
                  <DocumentIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{file.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{file.size} • {file.modified}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    file.shared ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {file.shared ? 'Shared' : 'Private'}
                  </span>
                  <div className="flex space-x-1">
                    <button className="btn-icon">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="btn-icon">
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button className="btn-icon text-red-600">
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
      {viewMode === 'list' && (
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
                      Modified
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
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentIcon className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                            <div className="text-sm text-gray-500">{file.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.modified}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          file.shared ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {file.shared ? 'Shared' : 'Private'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="btn-icon">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="btn-icon">
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button className="btn-icon text-red-600">
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
      {files.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading your first file.</p>
          <div className="mt-6">
            <button className="btn-primary">
              <CloudArrowUpIcon className="w-5 h-5 mr-2" />
              Upload Files
            </button>
          </div>
        </div>
      )}
    </div>
  )
}