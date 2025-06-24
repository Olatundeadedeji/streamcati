<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentPath = computed(() => route.path)
const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
<template>
  <!-- Skip link for accessibility -->
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-white">
    Skip to main content
  </a>
  
  <nav class="bg-white shadow" aria-label="Main navigation">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-indigo-600">StreamCati</h1>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <RouterLink 
              to="/contacts" 
              class="nav-link"
              :class="{ 'active-nav-link': currentPath.includes('/contacts') }"
              aria-current="page"
            >
              Contacts
            </RouterLink>
            <RouterLink 
              to="/interviews" 
              class="nav-link"
              :class="{ 'active-nav-link': currentPath.includes('/interviews') }"
            >
              Interviews
            </RouterLink>
            <RouterLink 
              to="/analytics" 
              class="nav-link"
              :class="{ 'active-nav-link': currentPath.includes('/analytics') }"
            >
              Analytics
            </RouterLink>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <button 
            class="btn-secondary flex items-center space-x-1"
            aria-label="User settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
            <span>Settings</span>
          </button>
          <button 
            @click="logout"
            class="btn-danger"
            aria-label="Log out"
          >
            Log out
          </button>
        </div>
        
        <!-- Mobile menu button -->
        <div class="flex items-center sm:hidden">
          <button 
            @click="toggleMobileMenu" 
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            :aria-expanded="mobileMenuOpen"
            aria-controls="mobile-menu"
          >
            <span class="sr-only">Open main menu</span>
            <svg 
              class="h-6 w-6" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div 
      v-show="mobileMenuOpen" 
      class="sm:hidden" 
      id="mobile-menu"
    >
      <div class="pt-2 pb-3 space-y-1">
        <RouterLink 
          to="/contacts" 
          class="mobile-nav-link"
          :class="{ 'active-mobile-nav-link': currentPath.includes('/contacts') }"
          @click="mobileMenuOpen = false"
        >
          Contacts
        </RouterLink>
        <RouterLink 
          to="/interviews" 
          class="mobile-nav-link"
          :class="{ 'active-mobile-nav-link': currentPath.includes('/interviews') }"
          @click="mobileMenuOpen = false"
        >
          Interviews
        </RouterLink>
        <RouterLink 
          to="/analytics" 
          class="mobile-nav-link"
          :class="{ 'active-mobile-nav-link': currentPath.includes('/analytics') }"
          @click="mobileMenuOpen = false"
        >
          Analytics
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
<style scoped>
.nav-link {
  @apply inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2;
}
.active-nav-link {
  @apply border-indigo-500 text-gray-900;
}
.mobile-nav-link {
  @apply block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500;
}
.active-mobile-nav-link {
  @apply bg-indigo-50 border-indigo-500 text-indigo-700;
}
.btn-secondary {
  @apply px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}
.btn-danger {
  @apply px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500;
}
</style>


























