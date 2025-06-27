<template>
  <div class="xform-renderer">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600">Loading form...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Form Loading Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <button 
            @click="retryLoad" 
            class="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Form container - always present but hidden during loading -->
    <div
      ref="formContainer"
      class="xform-container"
      :class="{
        'opacity-50 pointer-events-none': submitting,
        'hidden': loading || error
      }"
    >
      <!-- Form will be rendered here by Enketo -->
    </div>

    <!-- Validation errors -->
    <div v-if="validationErrors.length > 0" class="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">Validation Errors</h3>
          <ul class="mt-1 text-sm text-yellow-700 list-disc list-inside">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Form actions -->
    <div v-if="!loading && !error" class="mt-6 flex justify-between">
      <button
        @click="validateAndSubmit"
        :disabled="submitting"
        class="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="submitting">Submitting...</span>
        <span v-else>Submit Interview</span>
      </button>

      <div class="space-x-3">
        <button
          @click="saveProgress"
          :disabled="submitting"
          class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          Save Progress
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { XFormService, createXFormService, type XFormData } from '../services/xform'
import { useToast } from '../composables/useToast'

const props = defineProps({
  xmlPath: {
    type: String,
    required: true
  },
  interviewerName: {
    type: String,
    default: ''
  },
  instanceId: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'save', 'error', 'loaded'])

const { showToast } = useToast()

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)
const validationErrors = ref<string[]>([])
const formContainer = ref<HTMLElement | null>(null)

// XForm service instance
let xformService: XFormService | null = null

/**
 * Initialize XForm
 */
const initializeXForm = async () => {
  loading.value = true
  error.value = null

  try {
    // Create XForm service
    xformService = createXFormService({
      xmlPath: props.xmlPath,
      instanceId: props.instanceId,
      interviewerName: props.interviewerName
    })

    // Load XForm XML
    await xformService.loadXForm()

    // Wait for DOM to be ready
    await nextTick()

    if (!formContainer.value) {
      throw new Error('Form container not found')
    }

    // Initialize form in container
    await xformService.initializeForm(formContainer.value)

    loading.value = false
    emit('loaded')
    showToast('Form loaded successfully', 'success')

  } catch (err: any) {
    error.value = err.message || 'Failed to load form'
    loading.value = false
    emit('error', err)
    showToast('Failed to load form', 'error')
  }
}

/**
 * Retry loading the form
 */
const retryLoad = () => {
  if (formContainer.value) {
    formContainer.value.innerHTML = ''
  }
  initializeXForm()
}

/**
 * Validate form
 */
const validateForm = async (): Promise<boolean> => {
  if (!xformService) {
    showToast('Form not initialized', 'error')
    return false
  }

  const isValid = await xformService.validateForm()
  validationErrors.value = xformService.getValidationErrors()

  if (isValid) {
    showToast('Form is valid', 'success')
  } else {
    showToast('Please fix validation errors', 'warning')
  }

  return isValid
}

/**
 * Get form data
 */
const getFormData = (): XFormData | null => {
  if (!xformService) {
    return null
  }
  return xformService.getFormData()
}

/**
 * Save progress
 */
const saveProgress = () => {
  const formData = getFormData()
  if (formData) {
    emit('save', formData)
    showToast('Progress saved', 'success')
  }
}

/**
 * Validate and submit form
 */
const validateAndSubmit = async () => {
  if (!(await validateForm())) {
    return
  }

  submitting.value = true

  try {
    const formData = getFormData()
    if (!formData) {
      throw new Error('Failed to get form data')
    }

    emit('submit', formData)
    showToast('Interview submitted successfully', 'success')

  } catch (err: any) {
    showToast('Failed to submit interview', 'error')
    emit('error', err)
  } finally {
    submitting.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  initializeXForm()
})

onUnmounted(() => {
  if (xformService) {
    xformService.destroy()
  }
})

// Expose methods for parent component
defineExpose({
  getFormData,
  saveProgress,
  validateAndSubmit
})
</script>

<style scoped>
.xform-renderer {
  @apply w-full;
}

.xform-container {
  @apply w-full;
}

/* Enketo form styling overrides */
:deep(.or-form) {
  @apply w-full;
}

:deep(.question) {
  @apply mb-4 p-4 border border-gray-200 rounded-lg;
}

:deep(.question label) {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

:deep(.question input[type="text"], .question textarea, .question select) {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm;
}

:deep(.question input[type="radio"], .question input[type="checkbox"]) {
  @apply h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300;
}

:deep(.or-constraint-msg, .or-required-msg) {
  @apply text-red-600 text-sm mt-1;
}

:deep(.invalid-constraint, .invalid-required) {
  @apply border-red-300 focus:border-red-500 focus:ring-red-500;
}
</style>
