<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

defineProps<{
  title: string
  toggleSidebar: (event: MouseEvent) => void
}>()

const authStore = useAuthStore()
const notificationsOpen = ref(false)
const userMenuOpen = ref(false)

const toggleNotifications = () => {
  notificationsOpen.value = !notificationsOpen.value
  if (notificationsOpen.value) userMenuOpen.value = false
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
  if (userMenuOpen.value) notificationsOpen.value = false
}

// Sample notifications
const notifications = [
  { id: 1, message: 'New contact added', time: '5 minutes ago', read: false },
  { id: 2, message: 'Interview completed with John Doe', time: '1 hour ago', read: false },
  { id: 3, message: 'System update scheduled', time: '2 days ago', read: true }
]

const unreadCount = notifications.filter(n => !n.read).length
</script>

<template>
  <header class="bg-white shadow-sm z-10">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Left side: Title and mobile menu button -->
        <div class="flex items-center">
          <button 
            @click="toggleSidebar"
            class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-label="Open sidebar"
          >
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-xl font-semibold text-gray-900 ml-2 md:ml-0">{{ title }}</h1>
        </div>
        
        <!-- Right side: Notifications and user profile -->
        <div class="flex items-center space-x-4">
          <!-- Notifications -->
          <div class="relative">
            <button 
              @click="toggleNotifications"
              class="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="View notifications"
            >
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span v-if="unreadCount > 0" class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            <!-- Notifications dropdown -->
            <div 
              v-if="notificationsOpen"
              class="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="notifications-menu"
            >
              <div class="py-1" role="none">
                <div class="px-4 py-2 border-b border-gray-200">
                  <h3 class="text-sm font-medium text-gray-900">Notifications</h3>
                </div>
                <div v-if="notifications.length === 0" class="px-4 py-3 text-sm text-gray-500">
                  No new notifications
                </div>
                <div v-else class="max-h-60 overflow-y-auto">
                  <div 
                    v-for="notification in notifications" 
                    :key="notification.id"
                    :class="[
                      'px-4 py-3 hover:bg-gray-50 transition-colors',
                      !notification.read ? 'bg-blue-50' : ''
                    ]"
                  >
                    <div class="flex justify-between">
                      <p class="text-sm font-medium text-gray-900">{{ notification.message }}</p>
                      <span v-if="!notification.read" class="h-2 w-2 bg-blue-500 rounded-full"></span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">{{ notification.time }}</p>
                  </div>
                </div>
                <div class="border-t border-gray-200 px-4 py-2">
                  <button class="text-xs text-indigo-600 hover:text-indigo-900 font-medium">
                    Mark all as read
                  </button>
                  <button class="text-xs text-indigo-600 hover:text-indigo-900 font-medium ml-4">
                    View all
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- User profile -->
          <div class="relative">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
              :aria-expanded="userMenuOpen"
              aria-haspopup="true"
            >
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium text-gray-900">{{ authStore.user?.username }}</p>
                <p class="text-xs text-gray-600">{{ authStore.user?.role }}</p>
              </div>
              <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-indigo-700">
                  {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                </span>
              </div>
            </button>
            
            <!-- User menu dropdown -->
            <div 
              v-if="userMenuOpen"
              class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu"
            >
              <div class="py-1" role="none">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Your Profile</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Settings</a>
                <button 
                  @click="authStore.logout"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>