<script setup lang="ts">
import { ref } from 'vue'
import { nigerianStates } from '../constants/states'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: 'Location (State)'
  },
  placeholder: {
    type: String,
    default: 'Select a state'
  }
})

const emit = defineEmits(['update:modelValue'])

const updateValue = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div>
    <label :for="label.toLowerCase().replace(/\s+/g, '-')" class="block text-sm font-medium text-gray-700">
      {{ label }} {{ required ? '*' : '' }}
    </label>
    <select
      :id="label.toLowerCase().replace(/\s+/g, '-')"
      :value="modelValue"
      @change="updateValue"
      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      :required="required"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="state in nigerianStates" :key="state" :value="state">
        {{ state }}
      </option>
    </select>
  </div>
</template>