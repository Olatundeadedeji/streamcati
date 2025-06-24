<script setup lang="ts">
defineProps({
  currentStage: {
    type: Number,
    required: true
  },
  totalStages: {
    type: Number,
    required: true
  },
  progressPercentage: {
    type: Number,
    required: true
  }
})
</script>

<template>
  <div class="bg-white shadow rounded-lg p-4">
    <div class="flex justify-between items-center mb-2">
      <span class="text-sm font-medium text-gray-700">Progress</span>
      <span class="text-sm font-medium text-gray-700">{{ progressPercentage }}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2.5">
      <div class="bg-indigo-600 h-2.5 rounded-full" :style="{ width: `${progressPercentage}%` }"></div>
    </div>
    <div class="flex justify-between mt-2">
      <div class="flex items-center">
        <span class="text-xs text-gray-500">Stage {{ currentStage }} of {{ totalStages }}</span>
      </div>
    </div>
  </div>
</template>
