import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLoginMutation } from '../generated/graphql'
import { setAuthToken } from '../services/apollo'

export const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loginMutation] = useLoginMutation()

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

  const handleDemoLogin = () => {
    // For demo purposes, set a fake token
    localStorage.setItem('lokr_token', 'demo-token-123')
    window.location.reload()
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

        <div className="mt-8 space-y-6">
          {/* Secure Email/Password Login Form */}
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

          {/* Demo Login Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleDemoLogin}
              className="btn-outline w-full"
            >
              Demo Login (Skip Authentication)
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Or try GraphQL login: demo@lokr.com / demo123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}