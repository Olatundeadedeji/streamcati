import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../services/api'
import { importDataFromJson } from '../utils/dataImporter'

export interface Contact {
  id: number
  name: string
  email: string
  phone: string
  serialNumber: string
  cuid: string
  ticketNumber: string
  status: 'not_started' | 'round_1' | 'round_2' | 'round_3' | 'round_4' | 'completed' | 'not started' | '1' | '2' | '3' | '4'
  created_at: string
  last_contact: string | null
  interview_count: number
  location: string
  notes?: string
  current_round?: any
  interview_rounds?: any[]
}

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref<Contact[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const statusFilter = ref<string | null>(null)

  // Helper function to normalize status values
  const normalizeStatus = (status: string): Contact['status'] => {
    const statusMap: Record<string, Contact['status']> = {
      'not started': 'not_started',
      'not_started': 'not_started',
      '1': 'round_1',
      'round_1': 'round_1',
      '2': 'round_2',
      'round_2': 'round_2',
      '3': 'round_3',
      'round_3': 'round_3',
      '4': 'round_4',
      'round_4': 'round_4',
      'completed': 'completed'
    }
    return statusMap[status] || 'not_started'
  }

  const filteredContacts = computed(() => {
    let result = contacts.value

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        contact.serialNumber.toLowerCase().includes(query) ||
        contact.cuid.toLowerCase().includes(query) ||
        contact.ticketNumber.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter.value && statusFilter.value !== 'all') {
      result = result.filter(contact => {
        const normalizedStatus = normalizeStatus(contact.status)
        return normalizedStatus === statusFilter.value
      })
    }

    return result.map(contact => ({
      ...contact,
      status: normalizeStatus(contact.status)
    }))
  })

  // Actions
  const fetchContacts = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.get('/contacts/')
      contacts.value = response.data.results || response.data
      return contacts.value
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch contacts'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createContact = async (contactData: Partial<Contact>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.post('/contacts/', contactData)
      contacts.value.push(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to create contact'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateContact = async (id: number, contactData: Partial<Contact>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.patch(`/contacts/${id}/`, contactData)
      
      const index = contacts.value.findIndex(c => c.id === id)
      if (index !== -1) {
        contacts.value[index] = { ...contacts.value[index], ...response.data }
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update contact'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteContact = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      await apiClient.delete(`/contacts/${id}/`)
      contacts.value = contacts.value.filter(c => c.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete contact'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getContactById = async (id: number | undefined | null) => {
    // Validate input - ensure id is a valid number
    if (id === undefined || id === null || isNaN(Number(id))) {
      const errorMsg = `Invalid contact ID: ${id}. Expected a valid number.`
      console.error(errorMsg)
      error.value = errorMsg
      throw new Error(errorMsg)
    }

    const contactId = Number(id)

    // Check if we already have the contact in the store
    const existingContact = contacts.value.find(c => c.id === contactId)
    if (existingContact) return existingContact

    // Otherwise fetch it from the API
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.get(`/contacts/${contactId}/`)

      // Add to contacts array if not already there
      const index = contacts.value.findIndex(c => c.id === contactId)
      if (index === -1) {
        contacts.value.push(response.data)
      }

      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch contact'
      console.error(`Failed to fetch contact with ID ${contactId}:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add method to import contacts from JSON data
  const importContactsFromJson = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { contacts: importedContacts } = await importDataFromJson()
      
      // First fetch existing contacts to avoid duplicates
      await fetchContacts()
      
      // Add only contacts that don't already exist
      const existingIds = contacts.value.map(c => c.id)
      const newContacts = importedContacts.filter(c => !existingIds.includes(c.id as number))
      
      // Batch create contacts
      if (newContacts.length > 0) {
        for (const contact of newContacts) {
          try {
            const response = await apiClient.post('/contacts/', contact)
            contacts.value.push(response.data)
          } catch (err) {
            console.warn(`Failed to import contact ${contact.name}:`, err)
          }
        }
      }
      
      return contacts.value
    } catch (err: any) {
      error.value = err.message || 'Failed to import contacts'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    contacts,
    loading,
    error,
    searchQuery,
    statusFilter,
    filteredContacts,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    getContactById,
    importContactsFromJson
  }
})

