import React, { useState, useEffect } from 'react'
import { XMarkIcon, ShareIcon, LinkIcon, UserPlusIcon, ClipboardIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import {
  useGetFileShareInfoLazyQuery,
  useSearchUsersLazyQuery,
  useShareFileWithUserMutation,
  useRemoveFileShareMutation,
  useCreatePublicShareMutation,
  useRemovePublicShareMutation,
  PermissionType
} from '../generated/graphql'

interface FileShareModalProps {
  isOpen: boolean
  onClose: () => void
  file: {
    id: string
    originalName: string
    filename: string
  }
}

export const FileShareModal: React.FC<FileShareModalProps> = ({ isOpen, onClose, file }) => {
  const [publicShareEnabled, setPublicShareEnabled] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedPermission, setSelectedPermission] = useState<PermissionType>(PermissionType.Download)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // GraphQL hooks
  const [getFileShareInfo, { data: shareInfoData, loading: shareInfoLoading }] = useGetFileShareInfoLazyQuery()
  const [searchUsers, { data: searchUsersData, loading: searchUsersLoading }] = useSearchUsersLazyQuery()
  const [shareFileWithUser] = useShareFileWithUserMutation()
  const [removeFileShare] = useRemoveFileShareMutation()
  const [createPublicShare] = useCreatePublicShareMutation()
  const [removePublicShare] = useRemovePublicShareMutation()

  // Load sharing info when modal opens
  useEffect(() => {
    if (isOpen && file.id) {
      getFileShareInfo({
        variables: { fileId: file.id }
      })
    }
  }, [isOpen, file.id, getFileShareInfo])

  // Update public share enabled state when data changes
  useEffect(() => {
    console.log('Share info data changed:', shareInfoData?.fileShareInfo)
    if (shareInfoData?.fileShareInfo) {
      const hasToken = !!shareInfoData.fileShareInfo.shareToken
      console.log('Setting publicShareEnabled to:', hasToken, 'token:', shareInfoData.fileShareInfo.shareToken)
      setPublicShareEnabled(hasToken)
    }
  }, [shareInfoData])

  const handlePublicShareToggle = async () => {
    try {
      console.log('Toggle clicked, current state:', publicShareEnabled)

      if (publicShareEnabled) {
        // Remove public share
        console.log('Removing public share...')
        const result = await removePublicShare({
          variables: { fileId: file.id },
        })
        console.log('Remove public share result:', result)
        toast.success('Public sharing disabled')
      } else {
        // Create public share
        console.log('Creating public share...')
        const result = await createPublicShare({
          variables: { fileId: file.id },
        })
        console.log('Create public share result:', result)
        toast.success('Public sharing enabled')
      }

      // Add a small delay to ensure backend has processed the mutation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Reload share info with explicit cache bypass
      console.log('Refetching share info...')
      const refreshResult = await getFileShareInfo({
        variables: { fileId: file.id },
        fetchPolicy: 'network-only'
      })
      console.log('Refreshed share info:', refreshResult.data)
    } catch (error: any) {
      console.error('Error toggling public share:', error)
      toast.error(error.message || 'Failed to update sharing settings')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToClipboard(true)
      toast.success('Link copied to clipboard!')

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedToClipboard(false)
      }, 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleUserSearch = async (query: string) => {
    if (!query.trim()) {
      return
    }

    try {
      await searchUsers({
        variables: { query, limit: 10 }
      })
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    }
  }

  // Load all users on modal open for immediate display
  useEffect(() => {
    if (isOpen) {
      handleUserSearch('a') // Search for users containing 'a' to get most users
    }
  }, [isOpen])

  const handleShareWithUser = async (userId: string, userEmail: string) => {
    try {
      await shareFileWithUser({
        variables: {
          input: {
            fileId: file.id,
            sharedWithUserId: userId,
            permissionType: selectedPermission
          }
        }
      })

      toast.success(`File shared with ${userEmail}`)
      setUserSearchQuery('')

      // Reload share info
      await getFileShareInfo({
        variables: { fileId: file.id },
        fetchPolicy: 'no-cache'
      })
    } catch (error: any) {
      console.error('Error sharing file:', error)
      toast.error(error.message || 'Failed to share file')
    }
  }

  const handleRemoveUserShare = async (userId: string, userEmail: string) => {
    try {
      await removeFileShare({
        variables: {
          fileId: file.id,
          sharedWithUserId: userId
        }
      })

      toast.success(`Removed sharing with ${userEmail}`)

      // Reload share info
      await getFileShareInfo({
        variables: { fileId: file.id },
        fetchPolicy: 'no-cache'
      })
    } catch (error: any) {
      console.error('Error removing share:', error)
      toast.error(error.message || 'Failed to remove share')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <ShareIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Share File</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {shareInfoLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {/* File Info */}
              <div className="text-center">
                <h4 className="font-medium text-gray-900">{file.originalName}</h4>
                {shareInfoData?.fileShareInfo && shareInfoData.fileShareInfo.downloadCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Downloaded {shareInfoData.fileShareInfo.downloadCount} time{shareInfoData.fileShareInfo.downloadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Public Sharing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Public Link</h5>
                    <p className="text-sm text-gray-500">Anyone with the link can access</p>
                  </div>
                  <button
                    onClick={handlePublicShareToggle}
                    disabled={shareInfoLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      publicShareEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    } ${shareInfoLoading ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        publicShareEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {publicShareEnabled && shareInfoData?.fileShareInfo?.shareUrl && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <LinkIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <input
                      type="text"
                      value={shareInfoData.fileShareInfo.shareUrl}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-green-800 border-none focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(shareInfoData.fileShareInfo.shareUrl!)}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                    >
                      {copiedToClipboard ? (
                        <>
                          <CheckIcon className="w-3 h-3 inline mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="w-3 h-3 inline mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}

                {publicShareEnabled && !shareInfoData?.fileShareInfo?.shareUrl && (
                  <div className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-blue-800">Creating public share link...</span>
                  </div>
                )}
              </div>

              {/* User Sharing */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Share with Users</h5>

                {/* User Search */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Search users by email..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value)
                        handleUserSearch(e.target.value)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                      value={selectedPermission}
                      onChange={(e) => setSelectedPermission(e.target.value as PermissionType)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value={PermissionType.View}>View</option>
                      <option value={PermissionType.Download}>Download</option>
                      <option value={PermissionType.Edit}>Edit</option>
                      <option value={PermissionType.Delete}>Delete</option>
                    </select>
                  </div>

                  {/* Search Results */}
                  {searchUsersLoading && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Searching users...</p>
                    </div>
                  )}

                  {searchUsersData?.searchUsers && searchUsersData.searchUsers.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                      {searchUsersData.searchUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleShareWithUser(user.id, user.email)}
                          disabled={searchUsersLoading}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <UserPlusIcon className="w-4 h-4 text-blue-500 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Share
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchUsersData?.searchUsers && searchUsersData.searchUsers.length === 0 && userSearchQuery && (
                    <div className="text-center py-4 text-gray-500">
                      <UserPlusIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No users found matching "{userSearchQuery}"</p>
                    </div>
                  )}
                </div>

                {/* Current User Shares */}
                {shareInfoData?.fileShareInfo?.sharedWithUsers && shareInfoData.fileShareInfo.sharedWithUsers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Currently shared with:</p>
                    {shareInfoData.fileShareInfo.sharedWithUsers.map((share) => (
                      <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{share.shared_with.name}</p>
                          <p className="text-xs text-gray-500">{share.shared_with.email}</p>
                          <p className="text-xs text-blue-600">{share.permission_type} access</p>
                        </div>
                        <button
                          onClick={() => handleRemoveUserShare(share.shared_with_user_id, share.shared_with.email)}
                          disabled={shareInfoLoading}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}