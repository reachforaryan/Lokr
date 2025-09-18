import React, { useState } from 'react'
import {
  UsersIcon,
  ServerIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'system', name: 'System', icon: ServerIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ]

  // Mock data
  const systemStats = {
    totalUsers: 156,
    activeUsers: 89,
    totalFiles: 2430,
    storageUsed: '45.2 GB',
    storageLimit: '100 GB',
  }

  const recentUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', lastSeen: '2 hours ago' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', lastSeen: '1 day ago' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active', lastSeen: '30 minutes ago' },
  ]

  const systemHealth = [
    { name: 'Database', status: 'healthy', uptime: '99.9%' },
    { name: 'File Storage', status: 'healthy', uptime: '99.8%' },
    { name: 'Authentication', status: 'healthy', uptime: '100%' },
    { name: 'API Server', status: 'warning', uptime: '98.5%' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'inactive':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'inactive':
        return <ClockIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          System administration and user management
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DocumentIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Files</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats.totalFiles}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ServerIcon className="h-8 w-8 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Storage Used</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats.storageUsed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    {systemHealth.map((service, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full ${getStatusColor(service.status)}`}>
                            {getStatusIcon(service.status)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                  <button className="btn-primary">Add User</button>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Seen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UsersIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                              {getStatusIcon(user.status)}
                              <span className="ml-1">{user.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastSeen}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="btn-outline text-sm">Edit</button>
                              <button className="btn-outline text-red-600 border-red-600 hover:bg-red-50 text-sm">
                                Suspend
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

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Storage Management</h2>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Storage Usage</span>
                      <span className="text-sm text-gray-900">{systemStats.storageUsed} / {systemStats.storageLimit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <div className="flex justify-end">
                      <button className="btn-outline">Manage Storage</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
                </div>
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">User Registration</p>
                      <p className="text-sm text-gray-500">Allow new users to register</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">File Sharing</p>
                      <p className="text-sm text-gray-500">Allow users to share files publicly</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                </div>
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Force 2FA</p>
                      <p className="text-sm text-gray-500">Require all users to enable two-factor authentication</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Login Monitoring</p>
                      <p className="text-sm text-gray-500">Monitor and log all login attempts</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Security Events</h2>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-green-100">
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-900">Successful login from john@example.com</p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-yellow-100">
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-900">Failed login attempt from unknown IP</p>
                          <p className="text-xs text-gray-500">5 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}