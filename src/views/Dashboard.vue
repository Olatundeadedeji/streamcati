<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useContactsStore } from '../stores/contacts'
import { useInterviewStore } from '../stores/interview'
import { useToast } from '../composables/useToast'

const contactsStore = useContactsStore()
const interviewStore = useInterviewStore()
const { showToast } = useToast()

const isLoading = ref(true)
const error = ref<Error | null>(null)

interface Stats {
  totalContacts: number;
  activeInterviews: number;
  completedInterviews: number;
  todayInterviews: number;
}

interface Activity {
  id: number;
  type: 'interview_completed' | 'interview_started' | 'contact_added';
  contact: string;
  time: string;
}

const stats = ref<Stats>({
  totalContacts: 0,
  activeInterviews: 0,
  completedInterviews: 0,
  todayInterviews: 0
})

const recentActivity = ref<Activity[]>([
  { id: 1, type: 'interview_completed', contact: 'John Doe', time: '2 hours ago' },
  { id: 2, type: 'interview_started', contact: 'Jane Smith', time: '4 hours ago' },
  { id: 3, type: 'contact_added', contact: 'Bob Johnson', time: '6 hours ago' },
])

onMounted(async () => {
  try {
    isLoading.value = true
    await contactsStore.fetchContacts()
    updateStats()
    showToast('Dashboard data loaded successfully', 'success')
  } catch (e) {
    error.value = e as Error
    console.error('Failed to load dashboard data:', e)
    showToast('Failed to load dashboard data', 'error')
  } finally {
    isLoading.value = false
  }
})

const updateStats = () => {
  const contacts = contactsStore.contacts
  stats.value = {
    totalContacts: contacts.length,
    activeInterviews: contacts.filter(c => c.status === '1').length,
    completedInterviews: contacts.filter(c => c.status === '4').length,
    todayInterviews: contacts.filter(c => {
      const today = new Date().toDateString()
      return c.last_contact && new Date(c.last_contact).toDateString() === today
    }).length
  }
}



const importData = async () => {
  try {
    isLoading.value = true
    showToast('Importing data from JSON file...', 'info')
    
    // Import contacts first
    await contactsStore.importContactsFromJson()
    
    // Then import interviews and responses
    await interviewStore.importInterviewsFromJson()
    
    // Update dashboard stats
    updateStats()
    showToast('Data imported successfully', 'success')
  } catch (e) {
    error.value = e as Error
    console.error('Failed to import data:', e)
    showToast('Failed to import data: ' + (e as Error).message, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <!-- Add import button to dashboard -->
      <div class="flex justify-end mb-4">
        <button 
          @click="importData" 
          class="btn-primary flex items-center"
          :disabled="isLoading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import Data
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-indigo-100 text-indigo-600">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <h2 class="text-gray-600 text-sm font-medium">Total Contacts</h2>
            <p class="text-2xl font-semibold text-gray-800">{{ stats.totalContacts }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <h2 class="text-gray-600 text-sm font-medium">Active Interviews</h2>
            <p class="text-2xl font-semibold text-gray-800">{{ stats.activeInterviews }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-600">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <h2 class="text-gray-600 text-sm font-medium">Completed Interviews</h2>
            <p class="text-2xl font-semibold text-gray-800">{{ stats.completedInterviews }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-600">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="ml-4">
            <h2 class="text-gray-600 text-sm font-medium">Today's Interviews</h2>
            <p class="text-2xl font-semibold text-gray-800">{{ stats.todayInterviews }}</p>
          </div>
        </div>
      </div>
    </div>
    

  </div>
</template>





