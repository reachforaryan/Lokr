import React, { useState } from 'react'
import { ClockIcon, EyeIcon, ArrowDownTrayIcon, TrashIcon, ShareIcon, DocumentIcon, FolderIcon, UserIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useGetAuditLogsQuery, useGetRecentActivityQuery, useGetActivityStatsQuery } from '../generated/graphql'

export const AuditLog: React.FC = () => {
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    limit: 50,
    offset: 0
  })

  // Use generated Apollo hooks
  const { data: auditData, loading: auditLoading, error: auditError } = useGetAuditLogsQuery({
    variables: {
      limit: filters.limit,
      offset: filters.offset,
      action: filters.action || null,
      status: filters.status || null
    }
  })

  const { data: recentData, loading: recentLoading } = useGetRecentActivityQuery({
    variables: { limit: 10 }
  })

  const { data: statsData, loading: statsLoading } = useGetActivityStatsQuery({
    variables: { period: '7d' }
  })

  const auditLogs = auditData?.auditLogs || []
  const recentActivity = recentData?.recentActivity || []
  const activityStats = statsData?.activityStats
  const loading = auditLoading || recentLoading || statsLoading
  const error = auditError?.message || null

  // Filter handler - removed unused function

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'FILE_UPLOAD':
        return <DocumentIcon className="w-4 h-4" />
      case 'FILE_DOWNLOAD':
        return <ArrowDownTrayIcon className="w-4 h-4" />
      case 'FILE_PREVIEW':
        return <EyeIcon className="w-4 h-4" />
      case 'FILE_DELETE':
        return <TrashIcon className="w-4 h-4" />
      case 'FILE_SHARE':
      case 'PUBLIC_SHARE':
        return <ShareIcon className="w-4 h-4" />
      case 'FOLDER_CREATE':
        return <FolderIcon className="w-4 h-4" />
      case 'USER_LOGIN':
      case 'USER_REGISTER':
        return <UserIcon className="w-4 h-4" />
      default:
        return <DocumentIcon className="w-4 h-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'FILE_UPLOAD':
        return 'text-green-600'
      case 'FILE_DOWNLOAD':
        return 'text-blue-600'
      case 'FILE_PREVIEW':
        return 'text-gray-600'
      case 'FILE_DELETE':
        return 'text-red-600'
      case 'FILE_SHARE':
      case 'PUBLIC_SHARE':
        return 'text-purple-600'
      case 'USER_LOGIN':
      case 'USER_REGISTER':
        return 'text-indigo-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />
      case 'FAILED':
        return <XCircleIcon className="w-4 h-4 text-red-600" />
      case 'PENDING':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
      default:
        return <CheckCircleIcon className="w-4 h-4 text-gray-600" />
    }
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-2 text-gray-600">
          Real-time activity tracking and security monitoring
        </p>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {activityStats && Object.entries(activityStats).slice(0, 4).map(([action, count]) => (
          <div key={action} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${getActionColor(action)}`}>
                  {getActionIcon(action)}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {formatAction(action)}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{typeof count === 'number' ? count : 0}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, offset: 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Actions</option>
                    <option value="FILE_UPLOAD">File Upload</option>
                    <option value="FILE_DOWNLOAD">File Download</option>
                    <option value="FILE_PREVIEW">File Preview</option>
                    <option value="FILE_DELETE">File Delete</option>
                    <option value="FILE_SHARE">File Share</option>
                    <option value="PUBLIC_SHARE">Public Share</option>
                    <option value="USER_LOGIN">User Login</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, offset: 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limit
                  </label>
                  <select
                    value={filters.limit}
                    onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), offset: 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ action: '', status: '', limit: 50, offset: 0 })}
                    className="w-full btn-outline"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading audit logs...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resource
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 ${getActionColor(log.action)}`}>
                                {getActionIcon(log.action)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatAction(log.action)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {log.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.resourceName}</div>
                            <div className="text-sm text-gray-500">{log.resourceType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(log.status)}
                              <span className="ml-2 text-sm text-gray-900">
                                {log.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {log.user?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.user?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimestamp(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No audit logs found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Activity Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                  Live
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`flex-shrink-0 ${getActionColor(log.action)} mt-1`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">
                          {log.resourceName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatAction(log.action)} • {formatTimestamp(log.createdAt)}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {getStatusIcon(log.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}