import React, { useState } from 'react'
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  CloudArrowUpIcon,
  TrashIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState({
    fileUploads: true,
    sharing: true,
    security: true,
    marketing: false,
  })

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'storage', name: 'Storage', icon: CloudArrowUpIcon },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account preferences and security settings
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
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              </div>
              <div className="card-body space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="shrink-0">
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <button className="btn-secondary text-sm">Change Avatar</button>
                    <p className="text-sm text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input type="text" className="input" defaultValue="Demo" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input type="text" className="input" defaultValue="User" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input type="email" className="input" defaultValue="demo@lokr.app" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Password</h2>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input type="password" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input type="password" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input type="password" className="input" />
                  </div>
                  <div className="flex justify-end">
                    <button className="btn-primary">Update Password</button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
                </div>
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Two-factor authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <button className="btn-outline">
                      <KeyIcon className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
              </div>
              <div className="card-body space-y-6">
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {key === 'fileUploads' && 'File Upload Notifications'}
                          {key === 'sharing' && 'File Sharing Alerts'}
                          {key === 'security' && 'Security Alerts'}
                          {key === 'marketing' && 'Marketing Communications'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {key === 'fileUploads' && 'Get notified when files are uploaded'}
                          {key === 'sharing' && 'Alerts when files are shared with you'}
                          {key === 'security' && 'Important security notifications'}
                          {key === 'marketing' && 'Product updates and news'}
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [key]: !value })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary">Save Preferences</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Storage Usage</h2>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Used Storage</span>
                      <span className="text-sm text-gray-900">0 MB / 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                    <p className="text-sm text-gray-500">
                      You have 10 GB of storage remaining
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Storage Management</h2>
                </div>
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Auto-cleanup</p>
                      <p className="text-sm text-gray-500">Automatically delete files after 30 days in trash</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="pt-4 border-t">
                    <button className="btn-outline text-red-600 border-red-600 hover:bg-red-50">
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Clear All Data
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      This will permanently delete all your files and data
                    </p>
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