<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentPath = computed(() => route.path)

const toggleSidebar = () => {
  emit('toggle')
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Navigation items
const navItems = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
  },
  { 
    name: 'Contacts', 
    path: '/contacts', 
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' 
  },
  { 
    name: 'Interviews', 
    path: '/interviews', 
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' 
  },
  { 
    name: 'Analytics', 
    path: '/analytics', 
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' 
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' 
  }
]
</script>

<template>
  <aside 
    :class="[
      'bg-indigo-800 text-white transition-all duration-300 ease-in-out z-20',
      collapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-indigo-700">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-8 w-8 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div v-if="!collapsed" class="ml-2">
          <h1 class="text-xl font-bold">StreamCati</h1>
        </div>
      </div>
      <button 
        @click="toggleSidebar" 
        class="text-indigo-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Toggle sidebar"
      >
        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path v-if="collapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>
    
    <!-- Navigation -->
    <nav class="mt-5 px-2 space-y-1">
      <RouterLink 
        v-for="item in navItems" 
        :key="item.name"
        :to="item.path"
        :class="[
          currentPath === item.path || (item.path !== '/' && currentPath.includes(item.path))
            ? 'bg-indigo-900 text-white'
            : 'text-indigo-200 hover:bg-indigo-700',
          'group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors'
        ]"
        :aria-current="currentPath === item.path ? 'page' : undefined"
      >
        <svg 
          class="mr-3 h-6 w-6 text-indigo-300 flex-shrink-0" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
        </svg>
        <span v-if="!collapsed">{{ item.name }}</span>
        <span v-else class="sr-only">{{ item.name }}</span>
      </RouterLink>
    </nav>
    
    <!-- User Section -->
    <div class="absolute bottom-0 w-full border-t border-indigo-700 p-4">
      <div v-if="!collapsed" class="flex items-center">
        <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
          <span class="text-lg font-medium">
            {{ authStore.user?.username?.charAt(0).toUpperCase() }}
          </span>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-white">{{ authStore.user?.username }}</p>
          <p class="text-xs text-indigo-300">{{ authStore.user?.role }}</p>
        </div>
      </div>
      <div v-else class="flex justify-center">
        <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
          <span class="text-lg font-medium">
            {{ authStore.user?.username?.charAt(0).toUpperCase() }}
          </span>
        </div>
      </div>
      
      <button 
        @click="logout" 
        :class="[
          'mt-3 w-full flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
          collapsed ? 'px-2' : 'px-4'
        ]"
      >
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span v-if="!collapsed" class="ml-2">Logout</span>
      </button>
    </div>
  </aside>
</template>