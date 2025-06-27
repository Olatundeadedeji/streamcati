<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  existingResponse: {
    type: Object,
    default: null
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['response'])

const textAnswer = ref('')
const multipleChoiceAnswer = ref('')
const scaleAnswer = ref<number|null>(null)
const booleanAnswer = ref<boolean|null>(null)

// Computed properties

const shouldUseInput = computed(() => {
  return props.question.type === 'text' && props.readonly
})

// Initialize with existing response if available
watch(() => props.existingResponse, (newVal) => {
  if (newVal?.answer) {
    if (props.question.type === 'text') {
      textAnswer.value = newVal.answer
    } else if (props.question.type === 'multiple_choice') {
      multipleChoiceAnswer.value = newVal.answer
    } else if (props.question.type === 'scale') {
      scaleAnswer.value = newVal.answer
    } else if (props.question.type === 'boolean') {
      booleanAnswer.value = newVal.answer
    }
  }
}, { immediate: true })

// Reset answers when question changes
watch(() => props.question, () => {
  if (!props.existingResponse) {
    textAnswer.value = ''
    multipleChoiceAnswer.value = ''
    scaleAnswer.value = null
    booleanAnswer.value = null
  }
})

const handleTextChange = () => {
  emit('response', textAnswer.value)
}

const handleMultipleChoiceChange = () => {
  emit('response', multipleChoiceAnswer.value)
}

const handleScaleChange = () => {
  emit('response', scaleAnswer.value)
}

const handleBooleanChange = () => {
  emit('response', booleanAnswer.value)
}
</script>

<template>
  <div>
    <h3 class="text-lg font-medium text-gray-900 mb-4">{{ question.text }}</h3>
    
    <!-- Text input -->
    <div v-if="question.type === 'text'" class="mt-4">

      <!-- Use input for name questions or when readonly -->
      <input
        v-if="shouldUseInput"
        v-model="textAnswer"
        @input="handleTextChange"
        type="text"
        :readonly="readonly"
        :disabled="readonly"
        class="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
        :class="{
          'bg-gray-50 text-gray-600 cursor-not-allowed': readonly,
          'focus:ring-indigo-500 focus:border-indigo-500': !readonly
        }"
        :placeholder="question.placeholder || 'Enter your answer...'"
      />

      <!-- Use textarea for longer text questions -->
      <textarea
        v-else
        v-model="textAnswer"
        @input="handleTextChange"
        rows="3"
        :readonly="readonly"
        :disabled="readonly"
        class="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
        :class="{
          'bg-gray-50 text-gray-600 cursor-not-allowed': readonly,
          'focus:ring-indigo-500 focus:border-indigo-500': !readonly
        }"
        :placeholder="question.placeholder || 'Enter your answer...'"
      ></textarea>
    </div>
    
    <!-- Multiple choice -->
    <div v-else-if="question.type === 'multiple_choice'" class="mt-4">
      <div class="space-y-2">
        <div v-for="option in question.options" :key="option" class="flex items-center">
          <input
            type="radio"
            :id="option"
            :value="option"
            v-model="multipleChoiceAnswer"
            @change="handleMultipleChoiceChange"
            class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
          />
          <label :for="option" class="ml-3 block text-sm font-medium text-gray-700">
            {{ option }}
          </label>
        </div>
      </div>
    </div>
    
    <!-- Scale (1-5) -->
    <div v-else-if="question.type === 'scale'" class="mt-4">
      <div class="flex space-x-4 justify-between">
        <div v-for="value in [1, 2, 3, 4, 5]" :key="value" class="flex flex-col items-center">
          <button
            @click="scaleAnswer = value; handleScaleChange()"
            class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium"
            :class="scaleAnswer === value ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          >
            {{ value }}
          </button>
          <span class="mt-2 text-xs text-gray-500">
            {{ value === 1 ? 'Poor' : value === 2 ? 'Fair' : value === 3 ? 'Good' : value === 4 ? 'Very Good' : 'Excellent' }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Boolean (Yes/No) -->
    <div v-else-if="question.type === 'boolean'" class="mt-4">
      <div class="flex space-x-4">
        <button
          @click="booleanAnswer = true; handleBooleanChange()"
          class="px-4 py-2 rounded-md font-medium"
          :class="booleanAnswer === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
        >
          Yes
        </button>
        <button
          @click="booleanAnswer = false; handleBooleanChange()"
          class="px-4 py-2 rounded-md font-medium"
          :class="booleanAnswer === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
        >
          No
        </button>
      </div>
    </div>
  </div>
</template>
