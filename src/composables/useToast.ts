import { ref, readonly } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timeout?: number
}

// Create a single instance that will be shared across components
const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info', 
    timeout = 5000
  ) => {
    const id = nextId++
    const toast: Toast = {
      id,
      message,
      type,
      timeout
    }
    
    toasts.value.push(toast)
    
    if (timeout) {
      setTimeout(() => {
        removeToast(id)
      }, timeout)
    }
    
    return id
  }
  
  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  return {
    toasts: readonly(toasts),
    showToast,
    removeToast
  }
}
