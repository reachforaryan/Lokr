import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import toast from 'react-hot-toast'

// HTTP Link
const httpLink = createHttpLink({
  uri: '/graphql',
})

// Auth Link - Add JWT token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('lokr_token')

  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    }
  }
})

// Error Link - Handle GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('lokr_token')
        window.location.href = '/login'
        return
      }

      // Handle authorization errors
      if (extensions?.code === 'FORBIDDEN') {
        toast.error('Access denied')
        return
      }

      // Show user-friendly error messages
      toast.error(message || 'An error occurred')
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)

    if ('statusCode' in networkError) {
      switch (networkError.statusCode) {
        case 401:
          localStorage.removeItem('lokr_token')
          window.location.href = '/login'
          break
        case 403:
          toast.error('Access denied')
          break
        case 429:
          toast.error('Too many requests. Please slow down.')
          break
        default:
          toast.error('Network error occurred')
      }
    } else {
      toast.error('Network error occurred')
    }
  }
})

// Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        fields: {
          files: {
            merge: false, // Replace cache instead of merging
          },
        },
      },
      File: {
        fields: {
          shares: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
  },
})

// Helper functions for token management
export const setAuthToken = (token: string) => {
  localStorage.setItem('lokr_token', token)
}

export const removeAuthToken = () => {
  localStorage.removeItem('lokr_token')
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('lokr_token')
}