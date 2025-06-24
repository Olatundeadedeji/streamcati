<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useInterviewStore } from '../stores/interview'
import { useContactsStore } from '../stores/contacts'
import { useToast } from '../composables/useToast'
import { apiClient } from '../services/api'

// Define types for better TypeScript support
interface ResponseData {
  question: string;
  response: string;
  count: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
  }[];
}

const interviewStore = useInterviewStore()
const contactsStore = useContactsStore()
const { showToast } = useToast()

const isLoading = ref(true)
const error = ref<Error | null>(null)
const timeFrame = ref<'week' | 'month' | 'year'>('week')

// Bulk download filters
const selectedRounds = ref<number[]>([])
const dateFilter = ref<'30' | '60' | '90' | 'all'>('all')
const downloadFormat = ref<'csv' | 'excel' | 'pdf'>('csv')
const isDownloading = ref(false)

// Analytics data
const completedInterviews = ref(0)
const inProgressInterviews = ref(0)
const averageCompletionTime = ref(0)
const mostCommonResponses = ref<ResponseData[]>([])
const responseRateByDay = ref<ChartData>({
  labels: [],
  datasets: [{
    label: 'Responses',
    data: [],
    backgroundColor: []
  }]
})

// Computed properties for analytics insights
const totalInterviews = computed(() => 
  completedInterviews.value + inProgressInterviews.value
)

const completionRate = computed(() => 
  totalInterviews.value > 0 
    ? Math.round((completedInterviews.value / totalInterviews.value) * 100) 
    : 0
)

// Watch for timeframe changes to update data
watch(timeFrame, () => {
  fetchAnalyticsData()
})

// Fetch analytics data based on the selected time frame
const fetchAnalyticsData = async () => {
  try {
    isLoading.value = true
    
    // In a real implementation, you would fetch analytics data from your API
    // with the timeFrame parameter
    await Promise.all([
      contactsStore.fetchContacts(),
      interviewStore.fetchInterviews()
    ])
    
    // Calculate analytics based on the selected time frame
    const timeFrameFilter = getTimeFrameFilter()
    
    const filteredInterviews = interviewStore.interviews?.filter(interview => {
      const interviewDate = new Date(interview.started_at)
      return timeFrameFilter(interviewDate)
    }) || []
    
    completedInterviews.value = filteredInterviews.filter(i => i.status === 'completed').length
    inProgressInterviews.value = filteredInterviews.filter(i => i.status === 'in_progress').length
    
    // More complex calculations would happen here
    averageCompletionTime.value = calculateAverageCompletionTime(filteredInterviews)
    mostCommonResponses.value = getMostCommonResponses(filteredInterviews)
    responseRateByDay.value = getResponseRateByDay(filteredInterviews)
    
    showToast('Analytics data updated successfully', 'success')
  } catch (e) {
    error.value = e as Error
    console.error('Failed to load analytics data:', e)
    showToast('Failed to load analytics data', 'error')
  } finally {
    isLoading.value = false
  }
}

// Helper functions for analytics calculations
const getTimeFrameFilter = () => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  if (timeFrame.value === 'week') {
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    return (date: Date) => date >= startOfWeek
  } else if (timeFrame.value === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return (date: Date) => date >= startOfMonth
  } else if (timeFrame.value === 'year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    return (date: Date) => date >= startOfYear
  }
  
  // Default to all time
  return () => true
}

const calculateAverageCompletionTime = (_interviews: any[]) => {
  // This would be a real calculation in a production app
  // For now, return mock data based on timeFrame
  const mockData = {
    'week': 12.5,
    'month': 14.2,
    'year': 15.8
  }
  return mockData[timeFrame.value] || 0
}

const getMostCommonResponses = (interviews: any[]) => {
  // This would be a real calculation in a production app
  // For now, return mock data
  return [
    { question: "How did you hear about us?", response: "Social Media", count: timeFrame.value === 'week' ? 45 : timeFrame.value === 'month' ? 120 : 520 },
    { question: "Satisfaction rating", response: "Very Satisfied", count: timeFrame.value === 'week' ? 38 : timeFrame.value === 'month' ? 95 : 410 },
    { question: "Would recommend to others?", response: "Yes", count: timeFrame.value === 'week' ? 52 : timeFrame.value === 'month' ? 145 : 630 }
  ]
}

const getResponseRateByDay = (interviews: any[]) => {
  // This would calculate response rates by day of week
  // For now, return mock data
  return {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [{
      label: 'Responses',
      data: [65, 59, 80, 81, 56, 40, 30],
      backgroundColor: [
        'rgba(54, 162, 235, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(54, 162, 235, 0.5)'
      ]
    }]
  }
}

// Change time frame and update data
const changeTimeFrame = (frame: 'week' | 'month' | 'year') => {
  timeFrame.value = frame
}

// Export PDF report
const exportReport = () => {
  showToast('Exporting report...', 'info')
  // In a real app, this would generate and download a PDF
  setTimeout(() => {
    showToast('Report exported successfully', 'success')
  }, 1500)
}

// Bulk download functionality
const toggleRoundSelection = (round: number) => {
  const index = selectedRounds.value.indexOf(round)
  if (index > -1) {
    selectedRounds.value.splice(index, 1)
  } else {
    selectedRounds.value.push(round)
  }
}

const selectAllRounds = () => {
  selectedRounds.value = [1, 2, 3, 4]
}

const clearRoundSelection = () => {
  selectedRounds.value = []
}

const getDateFilterRange = () => {
  const now = new Date()
  const ranges = {
    '30': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '60': new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    '90': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    'all': null
  }
  return ranges[dateFilter.value]
}

const downloadBulkData = async () => {
  if (selectedRounds.value.length === 0) {
    showToast('Please select at least one interview round', 'error')
    return
  }

  isDownloading.value = true

  try {
    // Build query parameters
    const params = new URLSearchParams()

    // Add round filters
    selectedRounds.value.forEach(round => {
      params.append('rounds', round.toString())
    })

    // Add date filter
    const dateRange = getDateFilterRange()
    if (dateRange) {
      params.append('date_from', dateRange.toISOString().split('T')[0])
    }

    // Add format
    params.append('format', downloadFormat.value)

    showToast(`Preparing ${downloadFormat.value.toUpperCase()} download for ${selectedRounds.value.length} round(s)...`, 'info')

    // In a real implementation, this would call the API
    const response = await apiClient.get(`/analytics/bulk-download/?${params.toString()}`, {
      responseType: 'blob'
    })

    // Create download link
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    const timestamp = new Date().toISOString().split('T')[0]
    const roundsText = selectedRounds.value.length === 4 ? 'all-rounds' : `rounds-${selectedRounds.value.join('-')}`
    link.download = `interview-data-${roundsText}-${timestamp}.${downloadFormat.value}`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showToast('Download completed successfully', 'success')

  } catch (error) {
    console.error('Download failed:', error)
    showToast('Download failed. Please try again.', 'error')
  } finally {
    isDownloading.value = false
  }
}

const downloadAllData = async () => {
  selectedRounds.value = [1, 2, 3, 4]
  dateFilter.value = 'all'
  await downloadBulkData()
}

onMounted(() => {
  fetchAnalyticsData()
})
</script>

<template>
  <div id="main-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p class="text-gray-600 mt-1">View insights from your interviews</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="exportReport"
          class="btn-secondary flex items-center space-x-2"
          :disabled="isLoading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <span>Export Report</span>
        </button>

        <button
          @click="downloadAllData"
          class="btn-primary flex items-center space-x-2"
          :disabled="isLoading || isDownloading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <span>{{ isDownloading ? 'Downloading...' : 'Download All' }}</span>
        </button>
      </div>
      
    </div>
    
    <!-- Time frame selector -->
    <div class="mb-6 flex space-x-2">
      <button 
        @click="changeTimeFrame('week')" 
        class="px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        :class="timeFrame === 'week' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'"
        :aria-pressed="timeFrame === 'week'"
      >
        This Week
      </button>
      <button 
        @click="changeTimeFrame('month')" 
        class="px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        :class="timeFrame === 'month' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'"
        :aria-pressed="timeFrame === 'month'"
      >
        This Month
      </button>
      <button 
        @click="changeTimeFrame('year')" 
        class="px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        :class="timeFrame === 'year' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'"
        :aria-pressed="timeFrame === 'year'"
      >
        This Year
      </button>
    </div>

    <!-- Bulk Download Controls -->
    <div class="card p-6 mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Bulk Data Download</h3>

      <!-- Round Selection -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Interview Rounds</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button
            v-for="round in [1, 2, 3, 4]"
            :key="round"
            @click="toggleRoundSelection(round)"
            :class="[
              selectedRounds.includes(round)
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
              'px-3 py-1 rounded-full text-sm font-medium transition-colors'
            ]"
          >
            Round {{ round }}
          </button>
        </div>
        <div class="flex space-x-2">
          <button @click="selectAllRounds" class="text-sm text-indigo-600 hover:text-indigo-800">
            Select All
          </button>
          <button @click="clearRoundSelection" class="text-sm text-gray-600 hover:text-gray-800">
            Clear All
          </button>
        </div>
      </div>

      <!-- Date Filter -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
        <select v-model="dateFilter" class="form-select rounded-md border-gray-300 shadow-sm">
          <option value="all">All Time</option>
          <option value="30">Last 30 Days</option>
          <option value="60">Last 60 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      <!-- Format Selection -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Download Format</label>
        <select v-model="downloadFormat" class="form-select rounded-md border-gray-300 shadow-sm">
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      <!-- Download Button -->
      <div class="flex space-x-3">
        <button
          @click="downloadBulkData"
          :disabled="selectedRounds.length === 0 || isDownloading"
          class="btn-primary"
        >
          <svg v-if="isDownloading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isDownloading ? 'Downloading...' : 'Download Selected' }}
        </button>

        <div class="text-sm text-gray-500 flex items-center">
          {{ selectedRounds.length }} round(s) selected
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      <p class="text-gray-600 mt-2">Loading analytics data...</p>
    </div>
    
    <div v-else-if="error" class="text-center py-12">
      <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">
              Failed to load analytics data: {{ error.message }}
            </p>
          </div>
        </div>
      </div>
      <button 
        @click="fetchAnalyticsData" 
        class="btn-primary"
      >
        Try Again
      </button>
    </div>
    
    <div v-else>
      <!-- Summary stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">Completed Interviews</h3>
          <p class="mt-2 text-3xl font-bold text-indigo-600">{{ completedInterviews }}</p>
        </div>
        
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">In Progress</h3>
          <p class="mt-2 text-3xl font-bold text-amber-500">{{ inProgressInterviews }}</p>
        </div>
        
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">Completion Rate</h3>
          <p class="mt-2 text-3xl font-bold text-green-600">{{ completionRate }}%</p>
        </div>
        
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900">Avg. Completion Time</h3>
          <p class="mt-2 text-3xl font-bold text-blue-600">{{ averageCompletionTime }} min</p>
        </div>
      </div>
      
      <!-- Response rate by day chart (placeholder) -->
      <div class="card p-6 mb-8">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Response Rate by Day</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div class="flex space-x-1">
            <div v-for="(value, index) in responseRateByDay.datasets[0].data" :key="index" 
                class="w-10 bg-blue-400 rounded-t-md" 
                :style="`height: ${value}px`">
            </div>
          </div>
          <!-- In a real app, this would be a chart component -->
          <p class="text-gray-500 absolute">Chart visualization would appear here</p>
        </div>
        <div class="flex justify-center mt-4">
          <div v-for="(label, index) in responseRateByDay.labels" :key="index" class="text-xs text-gray-500 w-10 text-center">
            {{ label.substring(0, 3) }}
          </div>
        </div>
      </div>
      
      <!-- Common responses -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Most Common Responses</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(item, index) in mostCommonResponses" :key="index" v-memo="[item.question, item.response, item.count]">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.question }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.response }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply bg-white overflow-hidden shadow rounded-lg;
}
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed;
}
.form-select {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm;
}
</style>
