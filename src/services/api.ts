import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    
    // Log outgoing requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, 
        config.data ? config.data : '');
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, 
        response.data ? response.data : '');
    }
    return response
  },
  (error) => {
    // Log error responses in development
    if (import.meta.env.DEV) {
      if (error.response) {
        console.error(`❌ API Error ${error.response.status}: ${error.config.url}`, 
          error.response.data);
      } else if (error.request) {
        console.error(`❌ API No Response: ${error.config.url}`);
      } else {
        console.error(`❌ API Request Failed: ${error.message}`);
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Add a method to check API health
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/health-check/')
    return response.data
  } catch (error) {
    console.error('API health check failed:', error)
    throw error
  }
}
