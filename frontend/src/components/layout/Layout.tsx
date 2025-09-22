import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  DocumentIcon,
  CogIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Files', href: '/files', icon: DocumentIcon },
  { name: 'Audit Log', href: '/audit', icon: ClockIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Admin', href: '/admin', icon: UserGroupIcon },
]

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('lokr_token')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b">
            <h1 className="text-xl font-bold text-primary-600">🔒 Lokr</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col p-6">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isCurrent = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors ${
                        isCurrent
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                      }`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Logout */}
            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}