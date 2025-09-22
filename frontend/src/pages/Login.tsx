import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLoginMutation, useCreateEnterpriseMutation, useAcceptInvitationMutation } from '../generated/graphql'
import { setAuthToken } from '../services/apollo'

export const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'login' | 'new-user'>('login')
  const [newUserFlow, setNewUserFlow] = useState<'create-enterprise' | 'join-enterprise' | null>(null)

  // Enterprise creation states
  const [enterpriseName, setEnterpriseName] = useState('')
  const [enterpriseSlug, setEnterpriseSlug] = useState('')
  const [enterpriseDomain, setEnterpriseDomain] = useState('')

  // Join enterprise states
  const [invitationCode, setInvitationCode] = useState('')

  const [loginMutation] = useLoginMutation()
  const [createEnterpriseMutation] = useCreateEnterpriseMutation()
  const [acceptInvitationMutation] = useAcceptInvitationMutation()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await loginMutation({
        variables: {
          email,
          password
        }
      })

      if (result.data?.login) {
        const { token, user } = result.data.login
        setAuthToken(token)
        toast.success(`Welcome back, ${user.name}!`)
        // Reload to trigger auth state change
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEnterprise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password first')
      return
    }

    setIsLoading(true)

    try {
      // First login/register the user
      const loginResult = await loginMutation({
        variables: { email, password }
      })

      if (loginResult.data?.login) {
        const { token } = loginResult.data.login
        setAuthToken(token)

        // Then create the enterprise
        const enterpriseResult = await createEnterpriseMutation({
          variables: {
            input: {
              name: enterpriseName,
              slug: enterpriseSlug,
              domain: enterpriseDomain || undefined,
            }
          }
        })

        if (enterpriseResult.data?.createEnterprise) {
          toast.success('Enterprise created successfully!')
          window.location.reload()
        }
      }
    } catch (error: any) {
      console.error('Create enterprise error:', error)
      toast.error(error.message || 'Failed to create enterprise or login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinEnterprise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password first')
      return
    }

    setIsLoading(true)

    try {
      // First login/register the user
      const loginResult = await loginMutation({
        variables: { email, password }
      })

      if (loginResult.data?.login) {
        const { token } = loginResult.data.login
        setAuthToken(token)

        // Then join the enterprise
        const joinResult = await acceptInvitationMutation({
          variables: { token: invitationCode }
        })

        if (joinResult.data?.acceptInvitation) {
          toast.success('Successfully joined enterprise!')
          window.location.reload()
        }
      }
    } catch (error: any) {
      console.error('Join enterprise error:', error)
      toast.error(error.message || 'Failed to join enterprise or login')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-600 mb-2">🔒 Lokr</h1>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Secure file vault with intelligent deduplication
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex justify-center space-x-8" aria-label="Tabs">
            <button
              onClick={() => {
                setActiveTab('login')
                setNewUserFlow(null)
              }}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'login'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Existing User
            </button>
            <button
              onClick={() => setActiveTab('new-user')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'new-user'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              First Time Here?
            </button>
          </nav>
        </div>

        <div className="mt-8 space-y-6">
          {/* Existing User Tab */}
          {activeTab === 'login' && (
            <>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Create one here
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* New User Tab */}
          {activeTab === 'new-user' && (
            <>
              {!newUserFlow ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Lokr!</h3>
                    <p className="text-sm text-gray-600">
                      Choose how you'd like to get started
                    </p>
                  </div>

                  {/* Enterprise Options */}
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => setNewUserFlow('create-enterprise')}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">🏢</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Create Enterprise</h4>
                          <p className="text-sm text-gray-500">
                            Start a new organization and invite team members
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setNewUserFlow('join-enterprise')}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">🤝</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Join Enterprise</h4>
                          <p className="text-sm text-gray-500">
                            Join an existing organization with an invitation code
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Just want a personal account?{' '}
                      <Link
                        to="/register"
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        Register here
                      </Link>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2 mb-4">
                    <button
                      onClick={() => setNewUserFlow(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ← Back
                    </button>
                    <h3 className="text-lg font-medium text-gray-900">
                      {newUserFlow === 'create-enterprise' ? 'Create Enterprise' : 'Join Enterprise'}
                    </h3>
                  </div>

                  {/* Email and Password Required */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      First, provide your login credentials. We'll {newUserFlow === 'create-enterprise' ? 'register you and create' : 'register you and help you join'} the enterprise.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        id="new-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        placeholder="Create a secure password"
                      />
                    </div>
                  </div>

                  {/* Create Enterprise Form */}
                  {newUserFlow === 'create-enterprise' && (
                    <form onSubmit={handleCreateEnterprise} className="space-y-4">
                      <div>
                        <label htmlFor="enterprise-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Enterprise Name *
                        </label>
                        <input
                          id="enterprise-name"
                          type="text"
                          required
                          value={enterpriseName}
                          onChange={(e) => setEnterpriseName(e.target.value)}
                          className="input"
                          placeholder="My Company"
                        />
                      </div>
                      <div>
                        <label htmlFor="enterprise-slug" className="block text-sm font-medium text-gray-700 mb-1">
                          Slug (URL identifier) *
                        </label>
                        <input
                          id="enterprise-slug"
                          type="text"
                          required
                          value={enterpriseSlug}
                          onChange={(e) => setEnterpriseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          className="input"
                          placeholder="my-company"
                        />
                      </div>
                      <div>
                        <label htmlFor="enterprise-domain" className="block text-sm font-medium text-gray-700 mb-1">
                          Domain (optional)
                        </label>
                        <input
                          id="enterprise-domain"
                          type="text"
                          value={enterpriseDomain}
                          onChange={(e) => setEnterpriseDomain(e.target.value)}
                          className="input"
                          placeholder="company.com"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full"
                      >
                        {isLoading ? (
                          <>
                            <div className="spinner mr-2" />
                            Creating Enterprise & Account...
                          </>
                        ) : (
                          'Create Enterprise & Account'
                        )}
                      </button>
                    </form>
                  )}

                  {/* Join Enterprise Form */}
                  {newUserFlow === 'join-enterprise' && (
                    <form onSubmit={handleJoinEnterprise} className="space-y-4">
                      <div>
                        <label htmlFor="invitation-code" className="block text-sm font-medium text-gray-700 mb-1">
                          Invitation Code *
                        </label>
                        <input
                          id="invitation-code"
                          type="text"
                          required
                          value={invitationCode}
                          onChange={(e) => setInvitationCode(e.target.value)}
                          className="input"
                          placeholder="Enter your invitation code"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          You should have received this code from your enterprise administrator
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full"
                      >
                        {isLoading ? (
                          <>
                            <div className="spinner mr-2" />
                            Creating Account & Joining...
                          </>
                        ) : (
                          'Create Account & Join Enterprise'
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}