<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInterviewStore } from '../stores/interview'
import { useContactsStore } from '../stores/contacts'
import { useToast } from '../composables/useToast'
import XFormRenderer from '../components/XFormRenderer.vue'
import type { XFormData } from '../services/xform'

const route = useRoute()
const router = useRouter()
const interviewStore = useInterviewStore()
const contactsStore = useContactsStore()
const { showToast } = useToast()

const contactId = computed(() => {
  const id = Number(route.params.contactId)
  return isNaN(id) ? null : id
})
const interviewId = computed(() => route.query.id ? Number(route.query.id) : null)
const round = computed(() => route.query.round ? Number(route.query.round) : 1)
const contact = ref<any>(null)
const currentSection = ref<'introduction' | 'consent' | 'xform-questions'>('introduction')
const consentGiven = ref(false)
const isLoading = ref(true)
const error = ref<Error | null>(null)

// XForm configuration
const xformPath = '/anbcbCFiqWx8KzoVT9Rurz.xml'
const interviewerName = computed(() => {
  // Get authenticated user's name - you may need to adjust this based on your auth system
  return 'Current User' // TODO: Replace with actual authenticated user name
})

onMounted(async () => {
  isLoading.value = true
  
  try {
    // Validate contact ID
    if (!contactId.value) {
      showToast('Invalid contact ID', 'error')
      router.push('/contacts')
      return
    }
    
    // Fetch contact information
    contact.value = await contactsStore.getContactById(contactId.value)
    
    if (!contact.value) {
      showToast('Contact not found', 'error')
      router.push('/contacts')
      return
    }
    
    // Check if we're resuming an existing interview or starting a new one
    if (interviewId.value) {
      console.log('Resuming interview with ID:', interviewId.value)
      await interviewStore.resumeInterview(interviewId.value)
      console.log('Interview resumed successfully')
      
      // Set the current section to XForm questions since we're resuming
      currentSection.value = 'xform-questions'
    } else {
      console.log('Starting new interview for contact:', contactId.value, 'round:', round.value)
      await interviewStore.startInterview(contactId.value, round.value)
      console.log('Interview started successfully')
    }
    
    // Debug the interview state
    console.log('Current interview:', interviewStore.currentInterview)
    console.log('Questions loaded:', interviewStore.questions.length)
    console.log('Current question:', interviewStore.currentQuestion)
    
    isLoading.value = false
  } catch (err) {
    console.error('Failed to initialize interview:', err)
    error.value = err as Error
    showToast('Failed to initialize interview', 'error')
    router.push('/contacts')
  }
})





const handleNext = async () => {
  // If we're in the introduction section, move to consent
  if (currentSection.value === 'introduction') {
    currentSection.value = 'consent'
    return
  }

  // If we're in the consent section and consent is not given, show error
  if (currentSection.value === 'consent' && !consentGiven.value) {
    showToast('Consent is required to proceed.')
    return
  }

  // Move to XForm questions section if we're done with consent
  if (currentSection.value === 'consent') {
    currentSection.value = 'xform-questions'
    return
  }

  try {
    await interviewStore.nextQuestion()
    
    if (interviewStore.currentInterview?.status === 'completed') {
      showToast('Interview completed successfully!', 'success')
      router.push('/contacts')
    }
  } catch (error) {
    console.error('Failed to move to next question:', error)
    showToast('Failed to move to next question', 'error')
  }
}



const handlePause = async () => {
  try {
    await interviewStore.pauseInterview()
    showToast('Interview paused', 'info')
    router.push('/contacts')
  } catch (error) {
    console.error('Failed to pause interview:', error)
    showToast('Failed to pause interview', 'error')
  }
}

// XForm event handlers
const handleXFormSubmit = async (formData: XFormData) => {
  try {
    console.log('📊 XForm submission data:', formData)

    // Submit the complete form data to the backend
    await interviewStore.submitXFormData(formData)

    showToast('Interview completed successfully!', 'success')
    router.push('/contacts')
  } catch (error) {
    console.error('❌ Failed to submit XForm:', error)
    showToast('Failed to submit interview', 'error')
  }
}

const handleXFormSave = async (formData: XFormData) => {
  try {
    console.log('💾 Saving XForm progress:', formData)

    // Save progress to the backend
    await interviewStore.saveXFormProgress(formData)

    showToast('Progress saved successfully', 'success')
  } catch (error) {
    console.error('❌ Failed to save XForm progress:', error)
    showToast('Failed to save progress', 'error')
  }
}

const handleXFormError = (error: any) => {
  console.error('❌ XForm error:', error)
  showToast('Form error occurred', 'error')
}

const handleXFormLoaded = () => {
  console.log('✅ XForm loaded successfully')
}



const getRoundLabel = computed(() => {
  switch (round.value) {
    case 1: return 'Round 1 (Initial)'
    case 2: return 'Round 2 (3-month follow-up)'
    case 3: return 'Round 3 (6-month follow-up)'
    case 4: return 'Round 4 (9-month follow-up)'
    default: return `Round ${round.value}`
  }
})

const showIntroduction = computed(() => {
  return round.value === 1 && currentSection.value === 'introduction'
})

const showConsent = computed(() => {
  return currentSection.value === 'consent'
})

const showQuestions = computed(() => {
  return currentSection.value === 'xform-questions'
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="card p-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Interview Session</h1>
          <p v-if="contact" class="text-gray-600 mt-1">
            Contact: {{ contact.name }} - {{ contact.phone }}
          </p>
          <div class="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
               :class="{
                 'bg-orange-100 text-orange-800': round === 1,
                 'bg-blue-100 text-blue-800': round === 2,
                 'bg-purple-100 text-purple-800': round === 3,
                 'bg-green-100 text-green-800': round === 4
               }">
            {{ getRoundLabel }}
          </div>
        </div>
        <div class="flex space-x-3">
          <button @click="handlePause" class="btn-secondary">
            Pause Interview
          </button>
          

        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="card p-8 text-center">
      <p class="text-gray-600">Loading interview...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card p-8 text-center">
      <p class="text-red-600">{{ error.message || 'An error occurred' }}</p>
      <button @click="router.push('/contacts')" class="btn-primary mt-4">
        Return to Contacts
      </button>
    </div>

    <!-- Introduction Section -->
    <div v-else-if="showIntroduction" class="card p-6">
      <h2 class="text-xl font-semibold mb-4">Welcome to the Interview</h2>
      <p class="mb-4">
        Thank you for participating in this interview. We'll be asking you a series of questions
        about your experience. Your responses will help us improve our services.
      </p>
      <p class="mb-4">
        This interview will take approximately 15-20 minutes to complete. You can pause at any time
        and resume later if needed.
      </p>
      <div class="mt-6">
        <button @click="handleNext" class="btn-primary">
          Continue to Consent
        </button>
      </div>
    </div>

    <!-- Consent Section -->
    <div v-else-if="showConsent" class="card p-6">
      <h2 class="text-xl font-semibold mb-4">Consent Form</h2>
      <p class="mb-4">
        Before we begin, we need your consent to collect and process your responses.
        Your data will be handled according to our privacy policy.
      </p>
      <div class="mb-4">
        <label class="flex items-start">
          <input 
            type="checkbox" 
            v-model="consentGiven" 
            class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span class="ml-2 block text-sm text-gray-700">
            I consent to participate in this interview and allow my responses to be collected and processed.
          </span>
        </label>
      </div>
      <div class="mt-6">
        <button 
          @click="handleNext" 
          class="btn-primary"
          :disabled="!consentGiven"
        >
          Begin Interview
        </button>
      </div>
    </div>

    <!-- XForm Questions Section -->
    <div v-else-if="showQuestions" class="card p-6">
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">Interview Questions</h2>
          <div class="text-sm text-gray-500">
            {{ getRoundLabel }}
          </div>
        </div>
        <p class="text-gray-600 mt-2">
          Please complete all questions in the form below. Your progress will be saved automatically.
        </p>
      </div>

      <!-- XForm Renderer -->
      <XFormRenderer
        :xml-path="xformPath"
        :interviewer-name="interviewerName"
        :instance-id="`interview_${interviewStore.currentInterview?.id || Date.now()}`"
        @submit="handleXFormSubmit"
        @save="handleXFormSave"
        @error="handleXFormError"
        @loaded="handleXFormLoaded"
      />

      <!-- Pause Interview Button -->
      <div class="mt-6 pt-6 border-t border-gray-200 flex justify-between">
        <button
          @click="handlePause"
          class="btn-secondary"
        >
          Pause Interview
        </button>

        <div class="text-sm text-gray-500">
          Interview will be saved automatically when you submit or pause.
        </div>
      </div>
    </div>
  </div>
</template>

