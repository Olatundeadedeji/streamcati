import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../services/api'

export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'interviewer' | 'contact'
  phone?: string
  created_at: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isInterviewer = computed(() => user.value?.role === 'interviewer')
  const canLogin = computed(() => user.value?.role === 'admin' || user.value?.role === 'interviewer')

  const login = async (username: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.post('/auth/login/', {
        username,
        password
      })
      
      token.value = response.data.token
      user.value = response.data.user
      
      // Verify user can login (additional client-side check)
      if (!user.value || (user.value.role !== 'admin' && user.value.role !== 'interviewer')) {
        throw new Error('Access denied. Only administrators and interviewers can login.')
      }
      
      localStorage.setItem('auth_token', token.value!)
      apiClient.defaults.headers.common['Authorization'] = `Token ${token.value}`
      
      return true
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Login failed'
      // Clear any stored data on error
      token.value = null
      user.value = null
      localStorage.removeItem('auth_token')
      delete apiClient.defaults.headers.common['Authorization']
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    delete apiClient.defaults.headers.common['Authorization']
  }

  const checkAuth = async () => {
    if (!token.value) return false
    
    try {
      apiClient.defaults.headers.common['Authorization'] = `Token ${token.value}`
      const response = await apiClient.get('/auth/me/')
      user.value = response.data
      
      // Verify user can still login
      if (!user.value || (user.value.role !== 'admin' && user.value.role !== 'interviewer')) {
        logout()
        return false
      }
      
      return true
    } catch (err) {
      logout()
      return false
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isInterviewer,
    canLogin,
    login,
    logout,
    checkAuth
  }
})