import { useState, useEffect } from 'react'
import { useMeQuery } from '../generated/graphql'
import { getAuthToken, removeAuthToken } from '../services/apollo'

interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  user: any // User from GraphQL
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    user: null,
  })

  const token = getAuthToken()
  const isDemoToken = token === 'demo-token-123'

  const { data, loading, error } = useMeQuery({
    skip: !token || isDemoToken, // Skip query if no token or demo token
    errorPolicy: 'all',
    onError: (error) => {
      // If authentication fails, remove invalid token (but not demo token)
      if (!isDemoToken && error.graphQLErrors.some(err => err.extensions?.code === 'UNAUTHENTICATED')) {
        removeAuthToken()
      }
    }
  })

  useEffect(() => {
    if (!token) {
      setState({
        isAuthenticated: false,
        loading: false,
        user: null,
      })
      return
    }

    // Handle demo mode
    if (isDemoToken) {
      setState({
        isAuthenticated: true,
        loading: false,
        user: {
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@lokr.com',
          role: 'USER',
          storageUsed: 1024000,
          storageQuota: 10485760,
          emailVerified: true
        },
      })
      return
    }

    if (loading) {
      setState(prev => ({ ...prev, loading: true }))
      return
    }

    if (error || !data?.me) {
      setState({
        isAuthenticated: false,
        loading: false,
        user: null,
      })
      return
    }

    setState({
      isAuthenticated: true,
      loading: false,
      user: data.me,
    })
  }, [token, isDemoToken, data, loading, error])

  return state
}