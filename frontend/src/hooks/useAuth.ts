import { useState, useEffect } from 'react'
import { getAuthToken } from '../services/apollo'

interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  user: null // TODO: Define user type
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    user: null,
  })

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken()
      setState({
        isAuthenticated: !!token,
        loading: false,
        user: null, // TODO: Decode user from token or fetch from API
      })
    }

    checkAuth()
  }, [])

  return state
}