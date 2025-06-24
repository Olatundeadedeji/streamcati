
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../services/api'
import { importDataFromJson } from '../utils/dataImporter'
import { useContactsStore } from './contacts'

export interface Question {
  id: number
  text: string
  type: 'text' | 'multiple_choice' | 'scale' | 'boolean'
  stage: number
  routing_logic: any
  options?: string[]
  required: boolean
  section?: string
  round?: number | null // Which interview round this question belongs to (1-4)
}

export interface Response {
  id?: number
  question_id: number
  interview_id?: number
  contact_id?: number
  answer: any
  completed_at?: string
}

export interface InterviewRound {
  id: number
  round_number: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  scheduled_at: string
  can_start_interview: boolean
}

export interface Interview {
  id: number
  contact_id: number
  contact?: {
    id: number
    name: string
    email: string
    phone: string
    serialNumber: string
    cuid: string
    ticketNumber: string
    location: string
  }
  interview_round: InterviewRound
  stage: number
  status: 'in_progress' | 'completed' | 'paused'
  responses: Response[]
  started_at: string
  completed_at?: string
  current_question_index: number
}

export const useInterviewStore = defineStore('interview', () => {
  const currentInterview = ref<Interview | null>(null)
  const interviews = ref<Interview[]>([])
  const questions = ref<Question[]>([])
  const currentQuestion = ref<Question | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const autoSaveEnabled = ref(true)
  const roundFilter = ref<number | null>(null)
  
  // Get contacts store instance
  const contactsStore = useContactsStore()

  // Utility function to safely extract contact ID from interview
  const getContactIdFromInterview = (interview: Interview | null): number | null => {
    if (!interview) {
      console.warn('⚠️ No interview provided to getContactIdFromInterview')
      return null
    }

    // Try contact_id first (should be available after backend fix)
    if (interview.contact_id && typeof interview.contact_id === 'number') {
      console.log('✅ Found contact_id:', interview.contact_id)
      return interview.contact_id
    }

    // Fallback to contact.id if available
    if (interview.contact?.id && typeof interview.contact.id === 'number') {
      console.log('✅ Using contact.id as fallback:', interview.contact.id)
      return interview.contact.id
    }

    console.error('❌ No valid contact ID found in interview:', {
      contact_id: interview.contact_id,
      contact: interview.contact,
      interview_id: interview.id
    })
    return null
  }

  // Computed properties
  const currentStage = computed(() => currentInterview.value?.stage || 1)
  
  const stageQuestions = computed(() => {
    if (!currentInterview.value) return []
    
    const stage = currentInterview.value.stage
    const round = currentInterview.value.interview_round.round_number
    
    return questions.value.filter(q => 
      q.stage === stage && (q.round === null || q.round === round)
    )
  })
  
  const totalStages = computed(() => {
    const stages = questions.value.map(q => q.stage)
    return stages.length ? Math.max(...stages) : 1
  })
  
  const progressPercentage = computed(() => {
    if (!currentInterview.value || !stageQuestions.value.length) return 0
    
    const totalQuestions = questions.value.filter(q => 
      q.round === null || q.round === currentInterview.value?.interview_round.round_number
    ).length
    
    const answeredQuestions = currentInterview.value.responses.length
    
    return Math.round((answeredQuestions / totalQuestions) * 100)
  })
  
  const dueInterviews = computed(() => {
    const today = new Date()
    
    return interviews.value.filter(interview => {
      if (!interview.interview_round || interview.interview_round.round_number >= 4) return false
      
      const dueDate = new Date(interview.interview_round.scheduled_at)
      return dueDate <= today && interview.interview_round.status === 'active'
    })
  })

  // Actions
  const startInterview = async (contactId: number, roundId?: number) => {
    loading.value = true
    error.value = null
    
    try {
      let requestData: any = {
        contact_id: contactId,
        status: 'in_progress',
        stage: 1,
        current_question_index: 0
      }

      if (roundId) {
        requestData.interview_round_id = roundId
      }

      const response = await apiClient.post('/interviews/', requestData)
      
      currentInterview.value = response.data
      
      // Fetch questions if not already loaded
      if (!questions.value.length) {
        await fetchQuestions()
      }
      
      // Auto-populate known contact information
      console.log('Starting auto-population for new interview')
      await autoPopulateContactInfo()
      
      setCurrentQuestion()
      return currentInterview.value
    } catch (err: any) {
      error.value = err.response?.data?.error || err.response?.data?.detail || 'Failed to start interview'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const resumeInterview = async (interviewId: number) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('Resuming interview:', interviewId)
      
      // First get the interview details
      const response = await apiClient.get(`/interviews/${interviewId}/`)
      currentInterview.value = response.data
      
      console.log('Retrieved interview:', currentInterview.value)
      
      // Update status to in_progress if it was paused
      if (currentInterview.value && currentInterview.value.status === 'paused') {
        console.log('Interview was paused, updating to in_progress')
        await apiClient.patch(`/interviews/${interviewId}/`, {
          status: 'in_progress'
        })
        currentInterview.value.status = 'in_progress'
      }
      
      // Always fetch fresh questions for this round
      console.log('Fetching questions for round:', currentInterview.value?.interview_round.round_number)
      const questionsResponse = await apiClient.get('/interviews/questions/', {
        params: {
          round: currentInterview.value?.interview_round.round_number
        }
      })
      questions.value = questionsResponse.data.results || questionsResponse.data
      
      console.log('Fetched questions:', questions.value.length)
      
      // Set the current question
      setCurrentQuestion()
      console.log('Current question set:', currentQuestion.value)
      
      if (!currentQuestion.value) {
        throw new Error('No questions available for this interview round')
      }

      // Auto-populate known contact information
      console.log('About to call autoPopulateContactInfo')
      await autoPopulateContactInfo()
      console.log('Finished autoPopulateContactInfo')
      
      return currentInterview.value
    } catch (err: any) {
      console.error('Resume interview error:', err)
      error.value = err.response?.data?.detail || err.message || 'Failed to resume interview'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const fetchInterviews = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.get('/interviews/')
      interviews.value = response.data.results || response.data
      return interviews.value
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch interviews'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const fetchQuestions = async (round?: number) => {
    loading.value = true
    error.value = null
    
    try {
      const params: any = {}
      if (round) {
        params.round = round
      }
      
      const response = await apiClient.get('/interviews/questions/', { params })
      questions.value = response.data.results || response.data
      
      console.log(`Fetched ${questions.value.length} questions for round ${round || 'all'}`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch questions'
      console.error('Failed to fetch questions:', err)
    } finally {
      loading.value = false
    }
  }

  const setCurrentQuestion = () => {
    if (!currentInterview.value) return
    
    const stage = currentInterview.value.stage
    const round = currentInterview.value.interview_round.round_number
    
    // Filter questions by stage and round
    const stageQs = questions.value.filter(q => 
      q.stage === stage && (q.round === null || q.round === round)
    )
    
    let index = currentInterview.value.current_question_index
    
    // Find the first unanswered question starting from the current index
    while (index < stageQs.length) {
      const question = stageQs[index]
      const existingResponse = getResponseForQuestion(question.id)
      
      // If this question is not answered, use it as current question
      if (!existingResponse?.answer) {
        currentInterview.value.current_question_index = index
        currentQuestion.value = question
        return
      }
      
      index++
    }
    
    // If all questions are answered, set to the last question or null
    currentQuestion.value = stageQs[currentInterview.value.current_question_index] || null
  }

  const submitResponse = async (questionId: number, answer: any) => {
    if (!currentInterview.value) return
    
    try {
      // Log the request for debugging
      console.log('Submitting response:', {
        interview_id: currentInterview.value.id,
        question_id: questionId,
        answer
      })
      
      // Use the correct endpoint structure
      const response = await apiClient.post('/interviews/response/', {
        interview_id: currentInterview.value.id,
        question_id: questionId,
        answer
      })
      
      // Update local state
      const existingIndex = currentInterview.value.responses.findIndex(
        r => r.question_id === questionId
      )
      
      if (existingIndex !== -1) {
        currentInterview.value.responses[existingIndex] = response.data
      } else {
        currentInterview.value.responses.push(response.data)
      }
      
      // Auto-save interview state
      if (autoSaveEnabled.value) {
        await saveInterviewState()
      }
      
      return response.data
    } catch (err: any) {
      console.error('Response submission error:', err)
      // More detailed error handling
      if (err.response) {
        console.error('Error response data:', err.response.data)
        console.error('Error response status:', err.response.status)
        error.value = err.response.data?.detail || 
                     err.response.data?.message || 
                     `Server error (${err.response.status})`
      } else if (err.request) {
        console.error('No response received:', err.request)
        error.value = 'No response received from server'
      } else {
        console.error('Error message:', err.message)
        error.value = err.message || 'Failed to submit response'
      }
      throw err
    }
  }

  const nextQuestion = async () => {
    if (!currentInterview.value) return
    
    const stageQs = stageQuestions.value
    let currentIndex = currentInterview.value.current_question_index
    
    // Find the next unanswered question
    let nextIndex = currentIndex + 1
    while (nextIndex < stageQs.length) {
      const question = stageQs[nextIndex]
      const existingResponse = getResponseForQuestion(question.id)
      
      // If this question is not answered, use it
      if (!existingResponse?.answer) {
        currentInterview.value.current_question_index = nextIndex
        setCurrentQuestion()
        await saveInterviewState()
        return
      }
      
      nextIndex++
    }
    
    // If no more unanswered questions in this stage
    if (currentInterview.value.stage < totalStages.value) {
      await nextStage()
    } else {
      await completeInterview()
    }
    
    await saveInterviewState()
  }

  const previousQuestion = async () => {
    if (!currentInterview.value) return
    
    if (currentInterview.value.current_question_index > 0) {
      currentInterview.value.current_question_index--
      setCurrentQuestion()
      await saveInterviewState()
    }
  }

  const nextStage = async () => {
    if (!currentInterview.value) return
    
    currentInterview.value.stage++
    currentInterview.value.current_question_index = 0
    setCurrentQuestion()
    await saveInterviewState()
  }

  const completeInterview = async () => {
    if (!currentInterview.value) return
    
    try {
      await apiClient.patch(`/interviews/${currentInterview.value.id}/`, {
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      
      currentInterview.value.status = 'completed'
      currentInterview.value.completed_at = new Date().toISOString()
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to complete interview'
      throw err
    }
  }

  const pauseInterview = async () => {
    if (!currentInterview.value) return
    
    try {
      await apiClient.patch(`/interviews/${currentInterview.value.id}/`, {
        status: 'paused'
      })
      
      currentInterview.value.status = 'paused'
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to pause interview'
      throw err
    }
  }

  const saveInterviewState = async () => {
    if (!currentInterview.value) return
    
    try {
      await apiClient.patch(`/interviews/${currentInterview.value.id}/`, {
        current_question_index: currentInterview.value.current_question_index,
        stage: currentInterview.value.stage
      })
    } catch (err: any) {
      console.error('Failed to save interview state:', err)
    }
  }

  const getResponseForQuestion = (questionId: number) => {
    return currentInterview.value?.responses.find(r => r.question_id === questionId)
  }

  const autoPopulateContactInfo = async () => {
    if (!currentInterview.value) {
      console.log('❌ No current interview for auto-population')
      return
    }

    try {
      // Get contact ID using the utility function
      const contactId = getContactIdFromInterview(currentInterview.value)

      // Validate contact ID
      if (!contactId) {
        console.error('❌ No valid contact ID found in interview:', currentInterview.value)
        return
      }

      console.log('🔍 Fetching contact with ID:', contactId)

      // Get contact info using the contacts store
      const contact = await contactsStore.getContactById(contactId)
      
      if (!contact) {
        console.log('❌ No contact found for auto-population')
        return
      }
      
      console.log('✅ Found contact for auto-population:', contact)
      
      // Define field mappings with comprehensive keyword matching
      const fieldMappings = [
        {
          field: 'name',
          value: contact.name,
          keywords: ['name', 'full name', 'contact name', 'your name', 'participant name']
        },
        {
          field: 'phone',
          value: contact.phone,
          keywords: ['phone', 'contact number', 'telephone', 'mobile', 'phone number', 'contact info']
        },
        {
          field: 'serialNumber',
          value: contact.serialNumber,
          keywords: ['serial number', 'serial', 'serial no', 'device serial', 'product serial']
        },
        {
          field: 'cuid',
          value: contact.cuid,
          keywords: ['cuid', 'customer id', 'unique id', 'customer identifier', 'user id']
        },
        {
          field: 'ticketNumber',
          value: contact.ticketNumber,
          keywords: ['ticket number', 'ticket', 'ticket no', 'reference number', 'case number']
        },
        {
          field: 'location',
          value: contact.location,
          keywords: ['location', 'state', 'address', 'city', 'region', 'where are you located']
        }
      ]

      // Auto-populate each field
      for (const mapping of fieldMappings) {
        // Skip if the contact doesn't have this field value
        if (!mapping.value) {
          console.log(`⏭️ Skipping ${mapping.field} - no value in contact record`)
          continue
        }

        // Find questions that match any of the keywords for this field
        const matchingQuestions = questions.value
          .filter(q => {
            const questionText = q.text.toLowerCase()
            return mapping.keywords.some(keyword => 
              questionText.includes(keyword.toLowerCase())
            ) && 
            (q.round === null || q.round === currentInterview.value?.interview_round.round_number)
          })
          .slice(0, 2) // Limit to first 2 matching questions to avoid over-population

        console.log(`🔍 Found ${matchingQuestions.length} questions for ${mapping.field}:`, 
          matchingQuestions.map(q => ({ id: q.id, text: q.text })))

        // Auto-populate each matching question
        for (const question of matchingQuestions) {
          try {
            // Check if this question already has a response
            const existingResponse = getResponseForQuestion(question.id)
            if (existingResponse?.answer) {
              console.log(`⏭️ Skipping ${mapping.field} question ${question.id} - already answered`)
              continue
            }

            console.log(`🔄 Auto-populating ${mapping.field} question:`, question.id, 'with value:', mapping.value)
            await submitResponse(question.id, mapping.value)
            console.log(`✅ Successfully auto-populated ${mapping.field}`)
          } catch (error) {
            console.error(`❌ Failed to auto-populate ${mapping.field}:`, error)
            
            // Try a direct API call as fallback
            try {
              console.log(`🔄 Trying fallback method for ${mapping.field}`)
              const fallbackResponse = await apiClient.post('/interviews/response/', {
                interview_id: currentInterview.value.id,
                question_id: question.id,
                answer: mapping.value
              })
              
              // Update local state
              const existingIndex = currentInterview.value.responses.findIndex(
                r => r.question_id === question.id
              )
              
              if (existingIndex !== -1) {
                currentInterview.value.responses[existingIndex] = fallbackResponse.data
              } else {
                currentInterview.value.responses.push(fallbackResponse.data)
              }
              
              console.log(`✅ Successfully auto-populated ${mapping.field} using fallback`)
            } catch (fallbackError) {
              console.error(`❌ Fallback also failed for ${mapping.field}:`, fallbackError)
            }
          }
        }
      }

      // Refresh the current question after auto-population
      setCurrentQuestion()
      console.log('🔄 Current question after auto-population:', currentQuestion.value?.text)
      
    } catch (error) {
      console.error('❌ Auto-population error:', error)
    }
  }

  // Test function to manually trigger auto-population
  const testAutoPopulation = async () => {
    console.log('🧪 MANUAL TEST: Starting auto-population test')

    if (!currentInterview.value) {
      console.log('❌ No current interview for test')
      return
    }

    // Get contact ID using the utility function
    const contactId = getContactIdFromInterview(currentInterview.value)

    if (!contactId) {
      console.log('❌ No valid contact ID found for test')
      return
    }

    // Get contact information
    const { useContactsStore } = await import('./contacts')
    const contactsStore = useContactsStore()
    const contact = await contactsStore.getContactById(contactId)
    
    if (!contact) {
      console.log('❌ No contact found for test')
      return
    }

    console.log('🧪 Test contact:', contact.name)
    console.log('🧪 Current question:', currentQuestion.value?.text)
    
    // Try to auto-populate the current question if it's a name question
    if (currentQuestion.value && currentQuestion.value.text.toLowerCase().includes('name')) {
      try {
        console.log('🧪 Manually submitting response for current question')
        await submitResponse(currentQuestion.value.id, contact.name)
        console.log('🧪 Manual submission successful')
        
        // Refresh the current question
        setCurrentQuestion()
        console.log('🧪 Current question after refresh:', currentQuestion.value?.text)
        console.log('🧪 Can go next after manual submission:', canGoNext.value)
      } catch (error) {
        console.error('🧪 Manual submission failed:', error)
      }
    } else {
      console.log('🧪 Current question is not a name question')
    }
    
    await autoPopulateContactInfo()
    console.log('🧪 MANUAL TEST: Auto-population test complete')
  }

  const canGoNext = computed(() => {
    if (!currentQuestion.value || !currentInterview.value) return false
    
    if (currentQuestion.value.required) {
      const response = getResponseForQuestion(currentQuestion.value.id)
      return !!response?.answer
    }
    
    return true
  })

  const hasUnansweredQuestions = computed(() => {
    if (!currentInterview.value) return false
    
    const stage = currentInterview.value.stage
    const round = currentInterview.value.interview_round.round_number
    
    const stageQs = questions.value.filter(q => 
      q.stage === stage && (q.round === null || q.round === round)
    )
    
    return stageQs.some(question => {
      const response = getResponseForQuestion(question.id)
      return !response?.answer
    })
  })

  const setRoundFilter = (round: number | null) => {
    roundFilter.value = round
  }

  const importInterviewsFromJson = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { interviews: importedInterviews, responses } = await importDataFromJson()
      
      // First fetch existing interviews to avoid duplicates
      await fetchInterviews()
      
      // Add only interviews that don't already exist
      const existingIds = interviews.value.map(i => i.id)
      const newInterviews = importedInterviews.filter(i => !existingIds.includes(i.id as number))
      
      // Batch create interviews and their responses
      for (const interview of newInterviews) {
        try {
          // Create the interview
          const interviewResponse = await apiClient.post('/interviews/', interview)
          const createdInterview = interviewResponse.data
          
          // Find responses for this interview
          const interviewResponses = responses.filter(r => 
            r.interview_id === interview.id || 
            (r.contact_id === interview.contact_id && !r.interview_id)
          )
          
          // Add responses to the interview
          for (const response of interviewResponses) {
            response.interview_id = createdInterview.id
            await apiClient.post('/interviews/response/', response)
          }
          
          interviews.value.push(createdInterview)
        } catch (err) {
          console.warn(`Failed to import interview ${interview.id}:`, err)
        }
      }
      
      return interviews.value
    } catch (err: any) {
      error.value = err.message || 'Failed to import interviews'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    currentInterview,
    interviews,
    questions,
    currentQuestion,
    loading,
    error,
    autoSaveEnabled,
    currentStage,
    stageQuestions,
    totalStages,
    progressPercentage,
    canGoNext,
    hasUnansweredQuestions,
    dueInterviews,
    roundFilter,
    startInterview,
    resumeInterview,
    fetchInterviews,
    fetchQuestions,
    submitResponse,
    nextQuestion,
    previousQuestion,
    nextStage,
    completeInterview,
    pauseInterview,
    getResponseForQuestion,
    setRoundFilter,
    importInterviewsFromJson,
    autoPopulateContactInfo,
    testAutoPopulation
  }
})


