<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContactsStore } from '../stores/contacts'
import { useToast } from '../composables/useToast'
import ContactForm from '../components/ContactForm.vue'
import { apiClient } from '../services/api'

const router = useRouter()
const contactsStore = useContactsStore()
const { showToast } = useToast()

const isLoading = ref(true)
const showContactForm = ref(false)
const selectedContact = ref<Contact | null>(null)
const confirmDeleteId = ref<number | null>(null)
const showInterviewModal = ref(false)
const selectedContactForInterview = ref<Contact | null>(null)
const contactRounds = ref<any[]>([])
const loadingRounds = ref(false)

import type { Contact } from '../stores/contacts'

onMounted(async () => {
  try {
    await contactsStore.fetchContacts()
    isLoading.value = false
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
    showToast('Failed to fetch contacts', 'error')
  }
})

const openContactForm = (contact: Contact | null = null) => {
  selectedContact.value = contact
  showContactForm.value = true
}

const closeContactForm = () => {
  showContactForm.value = false
  selectedContact.value = null
}

const confirmDelete = (contactId: number) => {
  confirmDeleteId.value = contactId
}

const cancelDelete = () => {
  confirmDeleteId.value = null
}

const deleteContact = async (contactId: number) => {
  try {
    await contactsStore.deleteContact(contactId)
    showToast('Contact deleted successfully', 'success')
    confirmDeleteId.value = null
  } catch (error) {
    console.error('Failed to delete contact:', error)
    showToast('Failed to delete contact', 'error')
  }
}

const getStatusBadgeClass = (status: string) => {
  const classes = {
    'not_started': 'bg-gray-100 text-gray-800',
    'round_1': 'bg-blue-100 text-blue-800',
    'round_2': 'bg-yellow-100 text-yellow-800',
    'round_3': 'bg-purple-100 text-purple-800',
    'round_4': 'bg-green-100 text-green-800',
    'completed': 'bg-green-100 text-green-800'
  }
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'}`
}

const getStatusLabel = (status: string) => {
  const labels = {
    'not_started': 'Not Started',
    'round_1': 'Round 1',
    'round_2': 'Round 2',
    'round_3': 'Round 3',
    'round_4': 'Round 4',
    'completed': 'Completed'
  }
  return labels[status as keyof typeof labels] || status
}

const importContacts = async () => {
  try {
    showToast('Importing contacts from JSON file...', 'info')
    await contactsStore.importContactsFromJson()
    showToast('Contacts imported successfully', 'success')
  } catch (e) {
    console.error('Failed to import contacts:', e)
    showToast('Failed to import contacts: ' + (e as Error).message, 'error')
  }
}

const openInterviewModal = async (contact: Contact) => {
  selectedContactForInterview.value = contact
  showInterviewModal.value = true
  loadingRounds.value = true
  
  try {
    const response = await apiClient.get(`/interviews/contact/${contact.id}/rounds/`)
    contactRounds.value = response.data.rounds || []
  } catch (error) {
    console.error('Failed to fetch contact rounds:', error)
    showToast('Failed to fetch interview rounds', 'error')
    contactRounds.value = []
  } finally {
    loadingRounds.value = false
  }
}

const closeInterviewModal = () => {
  showInterviewModal.value = false
  selectedContactForInterview.value = null
  contactRounds.value = []
}

const startInterviewRound = async (roundNumber: number) => {
  // Validate contact selection
  if (!selectedContactForInterview.value) {
    console.error('No contact selected for interview')
    showToast('No contact selected', 'error')
    return
  }

  // Validate contact ID
  const contactId = selectedContactForInterview.value.id
  if (!contactId) {
    console.error('Selected contact has no ID:', selectedContactForInterview.value)
    showToast('Invalid contact selected', 'error')
    return
  }

  // Validate round number
  if (!roundNumber || roundNumber < 1 || roundNumber > 4) {
    console.error('Invalid round number:', roundNumber)
    showToast('Invalid interview round', 'error')
    return
  }

  try {
    console.log('Starting interview round:', {
      contactId,
      roundNumber,
      contact: selectedContactForInterview.value
    })

    // Make the API request
    const response = await apiClient.post(
      `/interviews/contact/${contactId}/round/${roundNumber}/start/`
    )

    // Log the complete response for debugging
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    })

    // Validate response data
    if (!response.data) {
      throw new Error('Empty response from server')
    }

    const interviewData = response.data
    if (!interviewData.id) {
      throw new Error('Server response missing interview ID')
    }

    // Success path
    showToast('Interview started successfully', 'success')
    closeInterviewModal()

    // Navigate to interview page with validated parameters
    const navigationParams = {
      name: 'Interview',
      params: { 
        contactId: contactId.toString()
      },
      query: {
        round: roundNumber.toString(),
        id: interviewData.id.toString()
      }
    }

    console.log('Navigating to interview with params:', navigationParams)
    await router.push(navigationParams)

  } catch (error: any) {
    // Detailed error logging
    console.error('Interview start error:', {
      error,
      response: error.response,
      data: error.response?.data,
      status: error.response?.status
    })

    // Determine appropriate error message
    let errorMessage = 'Failed to start interview'
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.response?.data?.details) {
      const details = typeof error.response.data.details === 'object'
        ? JSON.stringify(error.response.data.details)
        : error.response.data.details
      errorMessage = `${error.response.data.error}: ${details}`
    } else if (error.message) {
      errorMessage = error.message
    }

    showToast(errorMessage, 'error')
  }
}

const getRoundStatusClass = (status: string) => {
  const classes = {
    'pending': 'bg-gray-100 text-gray-800',
    'active': 'bg-green-100 text-green-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Contacts</h1>
      
      <div class="flex space-x-2">
        <button 
          @click="importContacts()" 
          class="btn-secondary flex items-center"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import Contacts
        </button>
        <button @click="openContactForm()" class="btn-primary">
          Add Contact
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            type="text"
            placeholder="Search contacts..."
            v-model="contactsStore.searchQuery"
            class="form-input"
          />
        </div>
        <div class="sm:w-48">
          <select v-model="contactsStore.statusFilter" class="form-input">
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="round_1">Round 1</option>
            <option value="round_2">Round 2</option>
            <option value="round_3">Round 3</option>
            <option value="round_4">Round 4</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="contactsStore.loading" class="card p-8 text-center">
      <p class="text-gray-600">Loading contacts...</p>
    </div>

    <!-- Contacts Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CUID (STREAM)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket Number 
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serial Number 
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interviews
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Contact
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="contact in contactsStore.filteredContacts" 
              :key="contact.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ contact.cuid }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ contact.ticketNumber }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ contact.serialNumber }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ contact.name }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ contact.location || 'Not Provided' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ contact.phone }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusBadgeClass(contact.status)">
                  {{ getStatusLabel(contact.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ contact.interview_count }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ contact.last_contact ? new Date(contact.last_contact).toLocaleDateString() : 'Never' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button 
                  @click="openInterviewModal(contact)"
                  class="text-primary-600 hover:text-primary-900 transition-colors"
                  :disabled="contact.status === 'completed'"
                >
                  Interview
                </button>
                <button 
                  @click="openContactForm(contact)"
                  class="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Edit
                </button>
                <button 
                  @click="deleteContact(contact.id)"
                  class="text-red-600 hover:text-red-900 transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="contactsStore.filteredContacts.length === 0" class="p-8 text-center">
        <p class="text-gray-500">No contacts found.</p>
      </div>
    </div>

    <!-- Contact Form Modal -->
    <ContactForm 
      v-if="showContactForm"
      :contact="selectedContact ?? undefined"
      @close="closeContactForm"
      @saved="closeContactForm"
    />

    <!-- Interview Rounds Modal -->
    <div v-if="showInterviewModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              Interview Rounds - {{ selectedContactForInterview?.name }}
            </h3>
            <button @click="closeInterviewModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div v-if="loadingRounds" class="text-center py-4">
            <p class="text-gray-600">Loading rounds...</p>
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="round in contactRounds" 
              :key="round.id"
              class="border rounded-lg p-4"
            >
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-medium">Round {{ round.round_number }}</h4>
                <span :class="getRoundStatusClass(round.status)">
                  {{ round.status }}
                </span>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">
                Scheduled: {{ formatDate(round.scheduled_at) }}
              </p>

              <button 
                v-if="round.status === 'completed'"
                disabled
                class="w-full btn-secondary text-sm opacity-50 cursor-not-allowed"
              >
                Completed
              </button>
              
              <button 
                v-else-if="round.round_number === 1 || round.can_start_interview"
                @click="startInterviewRound(round.round_number)"
                class="w-full btn-primary text-sm"
                :disabled="!selectedContactForInterview"
              >
                {{ round.status === 'active' ? 'Start Interview' : 'Not Available' }}
              </button>
              
              <button 
                v-else
                disabled
                class="w-full btn-secondary text-sm opacity-50 cursor-not-allowed"
              >
                Not Available Yet
              </button>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button @click="closeInterviewModal" class="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
