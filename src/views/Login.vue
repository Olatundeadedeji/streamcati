<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: ''
})

const errors = ref<Record<string, string>>({})

const validateForm = () => {
  errors.value = {}
  
  if (!form.username.trim()) {
    errors.value.username = 'Username is required'
  }
  
  if (!form.password) {
    errors.value.password = 'Password is required'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  const success = await authStore.login(form.username, form.password)
  if (success) {
    router.push('/')
  }
}

// Demo credentials for easy testing
const demoCredentials = [
  { username: 'admin', password: 'admin123', role: 'Administrator' },
  { username: 'interviewer1', password: 'interview123', role: 'Interviewer' },
  { username: 'interviewer2', password: 'interview123', role: 'Interviewer' }
]

const fillDemoCredentials = (username: string, password: string) => {
  form.username = username
  form.password = password
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          CATI System Login
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Sign in to your account
        </p>
        <p class="mt-1 text-center text-xs text-gray-500">
          Only administrators and interviewers can access the system
        </p>
      </div>
      
      <div class="card p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="form-input mt-1"
              :class="{ 'border-red-500': errors.username }"
              placeholder="Enter your username"
            />
            <p v-if="errors.username" class="mt-1 text-sm text-red-600">
              {{ errors.username }}
            </p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="form-input mt-1"
              :class="{ 'border-red-500': errors.password }"
              placeholder="Enter your password"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">
              {{ errors.password }}
            </p>
          </div>

          <div v-if="authStore.error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ authStore.error }}</p>
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="authStore.loading">Signing in...</span>
            <span v-else>Sign in</span>
          </button>
        </form>

        <!-- Demo Credentials -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</h3>
          <div class="space-y-2">
            <div 
              v-for="cred in demoCredentials" 
              :key="cred.username"
              class="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              @click="fillDemoCredentials(cred.username, cred.password)"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ cred.username }}</p>
                <p class="text-xs text-gray-600">{{ cred.role }}</p>
              </div>
              <button 
                type="button"
                class="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                Use
              </button>
            </div>
          </div>
          <p class="mt-3 text-xs text-gray-500">
            Click on any credential to auto-fill the form
          </p>
        </div>
      </div>
    </div>
  </div>
</template>