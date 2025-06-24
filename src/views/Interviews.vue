<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInterviewStore } from '../stores/interview'
import { useContactsStore } from '../stores/contacts'
import { useToast } from '../composables/useToast'
import { importDataFromJson } from '../utils/dataImporter'

const router = useRouter()
const interviewStore = useInterviewStore()
const contactsStore = useContactsStore()
const { showToast } = useToast()

const isLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')
const roundFilter = ref<number | null>(null)

onMounted(async () => {
  try {
    isLoading.value = true
    await Promise.all([
      interviewStore.fetchInterviews(),
      contactsStore.fetchContacts()
    ])
    showToast('Interviews loaded successfully', 'success')
  } catch (error) {
    console.error('Failed to load interviews:', error)
    showToast('Failed to load interviews', 'error')
  } finally {
    isLoading.value = false
  }
})

const filteredInterviews = computed(() => {
  let result = interviewStore.interviews

  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(interview => interview.status === statusFilter.value)
  }

  // Apply round filter
  if (roundFilter.value) {
    result = result.filter(interview => interview.round === roundFilter.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(interview => {
      const contact = contactsStore.getContactById(interview.contact_id)
      return contact && contact.name.toLowerCase().includes(query)
    })
  }

  return result
})

const getContactName = (contactId: number | string) => {
  const contact = contactsStore.getContactById(Number(contactId))
  return contact ? contact.name : 'Unknown Contact'
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'paused':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getRoundClass = (round: number) => {
  switch (round) {
    case 1:
      return 'bg-orange-100 text-orange-800'
    case 2:
      return 'bg-blue-100 text-blue-800'
    case 3:
      return 'bg-purple-100 text-purple-800'
    case 4:
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const resumeInterview = async (interviewId: number) => {
  try {
    await interviewStore.resumeInterview(interviewId)
    router.push(`/interview/${interviewStore.currentInterview?.contact_id}`)
  } catch (error) {
    console.error('Failed to resume interview:', error)
    showToast('Failed to resume interview', 'error')
  }
}

const startNewInterview = (contactId: number | string, round: number = 1) => {
  router.push(`/interview/${contactId}?round=${round}`)
}

interface Interview {
  id: number
  contact_id: number
  status: string
  round: number
  stage: number
  started_at?: string
  completed_at?: string
  next_round_due_date?: string
}

const isDueForInterview = (interview: Interview) => {
  if (!interview.next_round_due_date) return false
  
  const dueDate = new Date(interview.next_round_due_date)
  const today = new Date()
  
  return dueDate <= today && interview.round < 4
}

const getNextRoundDueDate = (interview: Interview) => {
  if (!interview.next_round_due_date) return 'Not scheduled'
  
  const dueDate = new Date(interview.next_round_due_date)
  const today = new Date()
  
  if (dueDate <= today) {
    return 'Due now'
  }
  
  // Calculate days until due
  const diffTime = Math.abs(dueDate.getTime() - today.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return `Due in ${diffDays} days`
}

const importInterviews = async () => {
  try {
    isLoading.value = true
    showToast('Importing interviews from JSON file...', 'info')
    await interviewStore.importInterviewsFromJson()
    showToast('Interviews imported successfully', 'success')
  } catch (e) {
    console.error('Failed to import interviews:', e)
    showToast('Failed to import interviews: ' + (typeof e === 'object' && e && 'message' in e ? (e as { message: string }).message : String(e)), 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Interviews</h1>
      <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search contacts..."
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-64"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <select
          v-model="statusFilter"
          class="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="all">All Statuses</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
        <select
          v-model="roundFilter"
          class="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option :value="null">All Rounds</option>
          <option :value="1">Round 1</option>
          <option :value="2">Round 2</option>
          <option :value="3">Round 3</option>
          <option :value="4">Round 4</option>
        </select>
      </div>
    </div>

    <div class="mb-6 bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-medium text-gray-900 mb-2">Interview Rounds</h2>
      <p class="text-sm text-gray-600 mb-4">
        Each contact goes through 4 rounds of interviews, scheduled 3 months apart. New contacts start with Round 1.
      </p>
      <div class="flex flex-wrap gap-2">
        <button 
          @click="roundFilter = null" 
          :class="[
            roundFilter === null ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700',
            'px-3 py-1 rounded-full text-sm font-medium'
          ]"
        >
          All Rounds
        </button>
        <button 
          @click="roundFilter = 1" 
          :class="[
            roundFilter === 1 ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800',
            'px-3 py-1 rounded-full text-sm font-medium'
          ]"
        >
          Round 1
        </button>
        <button 
          @click="roundFilter = 2" 
          :class="[
            roundFilter === 2 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800',
            'px-3 py-1 rounded-full text-sm font-medium'
          ]"
        >
          Round 2
        </button>
        <button 
          @click="roundFilter = 3" 
          :class="[
            roundFilter === 3 ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800',
            'px-3 py-1 rounded-full text-sm font-medium'
          ]"
        >
          Round 3
        </button>
        <button 
          @click="roundFilter = 4" 
          :class="[
            roundFilter === 4 ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800',
            'px-3 py-1 rounded-full text-sm font-medium'
          ]"
        >
          Round 4
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>

    <div v-else-if="filteredInterviews.length === 0" class="bg-white shadow rounded-lg p-6 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No interviews found</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || statusFilter !== 'all' || roundFilter ? 'Try changing your search or filter criteria.' : 'Get started by creating a new interview.' }}
      </p>
      <div class="mt-6">
        <router-link to="/contacts" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Start New Interview
        </router-link>
      </div>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="interview in filteredInterviews" :key="interview.id" class="px-6 py-4 hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                  {{ getContactName(interview.contact_id).charAt(0) }}
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ getContactName(interview.contact_id) }}
                </div>
                <div class="text-sm text-gray-500">
                  Started: {{ formatDate(interview.started_at) }}
                </div>
                <div v-if="interview.completed_at" class="text-sm text-gray-500">
                  Completed: {{ formatDate(interview.completed_at) }}
                </div>
                <div v-if="interview.next_round_due_date" class="text-sm text-gray-500">
                  Next round: {{ getNextRoundDueDate(interview) }}
                </div>
              </div>
            </div>
            <div class="flex items-center">
              <span :class="[getStatusClass(interview.status), 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-2']">
                {{ interview.status.replace('_', ' ') }}
              </span>
              <span :class="[getRoundClass(interview.round), 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-4']">
                Round {{ interview.round }}
              </span>
              <span class="text-sm text-gray-500 mr-4">
                Stage {{ interview.stage }} of 4
              </span>
              <button 
                v-if="interview.status !== 'completed'"
                @click="resumeInterview(interview.id)" 
                class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {{ interview.status === 'paused' ? 'Resume' : 'Continue' }}
              </button>
              <button 
                v-else-if="isDueForInterview(interview)"
                @click="startNewInterview(interview.contact_id, interview.round + 1)" 
                class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Start Round {{ interview.round + 1 }}
              </button>
              <button 
                v-else-if="interview.round < 4"
                class="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled
              >
                Next Round Scheduled
              </button>
              <button 
                v-else
                class="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled
              >
                All Rounds Completed
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>



