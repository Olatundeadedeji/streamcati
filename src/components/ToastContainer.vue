<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()

type ToastType = 'success' | 'error' | 'warning' | string

const getToastClasses = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-400 text-green-700'
    case 'error':
      return 'bg-red-50 border-red-400 text-red-700'
    case 'warning':
      return 'bg-yellow-50 border-yellow-400 text-yellow-700'
    default:
      return 'bg-blue-50 border-blue-400 text-blue-700'
  }
}

import { h, VNode } from 'vue'

const getToastIcon = (type: ToastType): VNode => {
  switch (type) {
    case 'success':
      return h('svg', { class: 'h-5 w-5 text-green-400', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
        h('path', { 'fill-rule': 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', 'clip-rule': 'evenodd' })
      ])
    case 'error':
      return h('svg', { class: 'h-5 w-5 text-red-400', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
        h('path', { 'fill-rule': 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z', 'clip-rule': 'evenodd' })
      ])
    case 'warning':
      return h('svg', { class: 'h-5 w-5 text-yellow-400', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
        h('path', { 'fill-rule': 'evenodd', d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z', 'clip-rule': 'evenodd' })
      ])
    default:
      return h('svg', { class: 'h-5 w-5 text-blue-400', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor' }, [
        h('path', { 'fill-rule': 'evenodd', d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z', 'clip-rule': 'evenodd' })
      ])
  }
}
</script>

<template>
  <div class="fixed bottom-0 right-0 p-6 z-50 space-y-4 w-full max-w-sm">
    <TransitionGroup 
      name="toast" 
      tag="div" 
      class="space-y-4"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="['border-l-4 p-4 shadow-md rounded-md', getToastClasses(toast.type)]"
        role="alert"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <component :is="getToastIcon(toast.type)" />
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium">{{ toast.message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <span v-html="getToastIcon(toast.type).el?.outerHTML ?? ''"></span>
            <button
              @click="removeToast(toast.id)"
              class="inline-flex text-gray-400 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
              aria-label="Dismiss"
            >
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>