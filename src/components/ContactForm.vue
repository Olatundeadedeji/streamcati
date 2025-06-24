<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useContactsStore } from '../stores/contacts'
import LocationSelector from './LocationSelector.vue'

const props = defineProps({
  contact: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const contactsStore = useContactsStore()

const form = reactive({
  name: '',
  serialNumber: '',
  cuid: '',
  ticketNumber: '',
  phone: '',
  location: '',
  status: 'not_started'
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

watch(() => props.contact, (contact) => {
  if (contact) {
    form.name = contact.name
    form.serialNumber = contact.serialNumber
    form.cuid = contact.cuid || ''
    form.ticketNumber = contact.ticketNumber || ''
    form.phone = contact.phone
    form.location = contact.location || ''
    form.status = contact.status
  }
}, { immediate: true })

const validateForm = () => {
  errors.value = {}
  
  if (!form.name.trim()) {
    errors.value.name = 'Name is required'
  }
  
  if (!form.phone.trim()) {
    errors.value.phone = 'Phone is required'
  }
  
  if (!form.serialNumber.trim()) {
    errors.value.serialNumber = 'Serial Number is required'
  }
  
  if (!form.cuid.trim()) {
    errors.value.cuid = 'CUID is required'
  }
  
  if (!form.ticketNumber.trim()) {
    errors.value.ticketNumber = 'Ticket Number is required'
  }
  
  // Phone number validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  if (form.phone.trim() && !phoneRegex.test(form.phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.value.phone = 'Please enter a valid phone number'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const contactData = {
      ...form,
      status: form.status as 'not started' | '1' | '2' | '3'| '4'
    }
    if (props.contact) {
      await contactsStore.updateContact(props.contact.id, contactData)
    } else {
      await contactsStore.createContact(contactData)
    }
    emit('saved')
  } catch (error) {
    const errorMsg = (error instanceof Error) ? error.message : String(error)
    
    // Parse backend validation errors
    if (errorMsg.includes('non_field_errors') || errorMsg.includes('unique')) {
      errors.value.general = 'A contact with this combination of phone, serial number, CUID, and ticket number already exists.'
    } else if (errorMsg.includes('phone:')) {
      errors.value.phone = errorMsg.split('phone:')[1]?.split('\n')[0]?.trim() || 'Invalid phone number'
    } else if (errorMsg.includes('serialNumber:')) {
      errors.value.serialNumber = errorMsg.split('serialNumber:')[1]?.split('\n')[0]?.trim() || 'Invalid serial number'
    } else if (errorMsg.includes('cuid:')) {
      errors.value.cuid = errorMsg.split('cuid:')[1]?.split('\n')[0]?.trim() || 'Invalid CUID'
    } else if (errorMsg.includes('ticketNumber:')) {
      errors.value.ticketNumber = errorMsg.split('ticketNumber:')[1]?.split('\n')[0]?.trim() || 'Invalid ticket number'
    } else {
      errors.value.general = errorMsg
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Modal Overlay -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ contact ? 'Edit Contact' : 'Add New Contact' }}
        </h3>
      </div>

      <!-- Modal Body -->
      <form @submit.prevent="handleSubmit" class="px-6 py-4 space-y-4">
        <!-- General Error Message -->
        <div v-if="errors.general" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ errors.general }}
        </div>

        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-input mt-1"
            :class="{ 'border-red-500': errors.name }"
            required
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">
            {{ errors.name }}
          </p>
        </div>

        <div>
          <label for="serialNumber" class="block text-sm font-medium text-gray-700">
            Serial Number *
          </label>
          <input
            id="serialNumber"
            v-model="form.serialNumber"
            type="text"
            class="form-input mt-1"
            :class="{ 'border-red-500': errors.serialNumber }"
            required
          />
          <p v-if="errors.serialNumber" class="mt-1 text-sm text-red-600">
            {{ errors.serialNumber }}
          </p>
        </div>

        <div>
          <label for="cuid" class="block text-sm font-medium text-gray-700">
            CUID *
          </label>
          <input
            id="cuid"
            v-model="form.cuid"
            type="text"
            class="form-input mt-1"
            :class="{ 'border-red-500': errors.cuid }"
            required
          />
          <p v-if="errors.cuid" class="mt-1 text-sm text-red-600">
            {{ errors.cuid }}
          </p>
        </div>

        <div>
          <label for="ticketNumber" class="block text-sm font-medium text-gray-700">
            Ticket Number *
          </label>
          <input
            id="ticketNumber"
            v-model="form.ticketNumber"
            type="text"
            class="form-input mt-1"
            :class="{ 'border-red-500': errors.ticketNumber }"
            required
          />
          <p v-if="errors.ticketNumber" class="mt-1 text-sm text-red-600">
            {{ errors.ticketNumber }}
          </p>
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700">
            Phone *
          </label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            class="form-input mt-1"
            :class="{ 'border-red-500': errors.phone }"
            required
          />
          <p v-if="errors.phone" class="mt-1 text-sm text-red-600">
            {{ errors.phone }}
          </p>
        </div>

       

        <div>
          <label for="status" class="block text-sm font-medium text-gray-700">
           Round of Interview
          </label>
          <select
            id="status"
            v-model="form.status"
            class="form-input mt-1"
          >
            <option value="not started">Not started</option>
            <option value="1">Round 1</option>
            <option value="2">Round 2</option>
            <option value="3">Round 3</option>
            <option value="4">Round 4</option>
          </select>
        </div>

        <div>
          <LocationSelector
            v-model="form.location"
            label="Location (State)"
            placeholder="Select a state"
          />
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            @click="emit('close')"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : (contact ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
