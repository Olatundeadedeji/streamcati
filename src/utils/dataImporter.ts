import { Contact } from '../stores/contacts';
import { Interview, Response } from '../stores/interview';
import { nigerianStates } from '../constants/states';

interface RawDataItem {
  'Serial Number': number;
  'Q1F: Name of Customer': string;
  'Q1G: Phone Number of the respondent': string;
  'Q1H: Location of Respondent (State)': string;
  'Q1I: Round of interview': string;
  'Q1J: Study Arm': string;
  'Q2A: Customer Unique Identification  - CUID (STREAM)': number;
  'Q2B: Ticket Number (CUID – H & B)': number;
  'Q1E: Date/start time of the call': string;
  'Q1E: Start Time': string;
  [key: string]: any;
}

export async function importDataFromJson(): Promise<{
  contacts: Partial<Contact>[];
  interviews: Partial<Interview>[];
  responses: Partial<Response>[];
}> {
  try {
    // Fetch the JSON data
    const response = await fetch('/data.json');
    const rawData: RawDataItem[] = await response.json();
    
    const contacts: Partial<Contact>[] = [];
    const interviews: Partial<Interview>[] = [];
    const responses: Partial<Response>[] = [];
    
    // Process each data item
    rawData.forEach(item => {
      // Normalize state name to match our constants
      const rawState = item['Q1H: Location of Respondent (State)'];
      const normalizedState = normalizeStateName(rawState);
      
      // Create contact
      const contact: Partial<Contact> = {
        id: item['Q2A: Customer Unique Identification  - CUID (STREAM)'],
        name: item['Q1F: Name of Customer'],
        phone: item['Q1G: Phone Number of the respondent'],
        email: `${item['Q1F: Name of Customer'].toLowerCase().replace(/\s+/g, '.')}@example.com`,
        status: 'not_started',
        created_at: item['Q1E: Date/start time of the call'],
        last_contact: item['Q1E: Start Time'],
        interview_count: 1
      };
      
      // Create interview
      const interview: Partial<Interview> = {
        id: item['Serial Number'],
        contact_id: item['Q2A: Customer Unique Identification  - CUID (STREAM)'],
        status: 'completed',
        started_at: item['Q1E: Start Time'],
        completed_at: item['Q1E: Start Time'], // Assuming completed same day
        current_question_index: 0
      };
      
      // Create responses from the data
      const questionMappings = [
        { key: '3a: Respecting you as a person .', id: 301, type: 'scale' },
        { key: '3b: Letting you say what matters to you about your family planning method .', id: 302, type: 'scale' },
        { key: '3c: Taking what you prefer seriously .', id: 303, type: 'scale' },
        { key: '3d: Giving you enough information to make the best decision about your method .', id: 304, type: 'scale' },
        { key: '4a: Respecting you as a person', id: 401, type: 'scale' },
        { key: '4b : Letting you say what matters to you about your family planning method .', id: 402, type: 'scale' },
        { key: '4c: Taking what you prefer seriously .', id: 403, type: 'scale' },
        { key: 'Q7: Overall, how satisfied have you been with your method? You can say "not satisfied", "somewhat satisfied" or "very satisfied"', id: 701, type: 'multiple_choice' },
        { key: 'Q8: Are you still using the same method, a different method, or no longer using a method?', id: 801, type: 'multiple_choice' }
      ];
      
      // Process each question mapping
      questionMappings.forEach(mapping => {
        if (item[mapping.key]) {
          const response: Partial<Response> = {
            question_id: mapping.id,
            answer: convertAnswer(item[mapping.key], mapping.type),
            completed_at: item['Q1E: Start Time']
          };
          responses.push(response);
        }
      });
      
      // Add identification data
      responses.push({
        question_id: 101,
        answer: item['Q1F: Name of Customer'],
        completed_at: item['Q1E: Start Time']
      });
      
      responses.push({
        question_id: 102,
        answer: item['Q1G: Phone Number of the respondent'],
        completed_at: item['Q1E: Start Time']
      });
      
      responses.push({
        question_id: 103,
        answer: normalizedState,
        completed_at: item['Q1E: Start Time']
      });
      
      // Add to collections
      contacts.push(contact);
      interviews.push(interview);
    });
    
    // Remove duplicates by ID
    const uniqueContacts = removeDuplicates(contacts, 'id');
    const uniqueInterviews = removeDuplicates(interviews, 'id');
    
    return {
      contacts: uniqueContacts,
      interviews: uniqueInterviews,
      responses
    };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

// Helper function to normalize state names
function normalizeStateName(rawState: string): string {
  if (!rawState || rawState === 'Not Provided') {
    return 'Not Provided';
  }
  
  // Convert to title case for consistency
  const titleCase = rawState.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
  
  // Find closest match in Nigerian states
  const exactMatch = nigerianStates.find(state => state === titleCase);
  if (exactMatch) {
    return exactMatch;
  }
  
  // Handle common abbreviations or misspellings
  const stateMap: Record<string, string> = {
    'FCT': 'FCT',
    'Abj': 'FCT',
    'Abuja': 'FCT',
    'Lag': 'Lagos',
    'Ibadan': 'Oyo',
    'PH': 'Rivers',
    'Port Harcourt': 'Rivers',
    'Kd': 'Kaduna'
  };
  
  return stateMap[titleCase] || 'Not Provided';
}

// Helper function to convert answer based on type
function convertAnswer(value: string, type: string): any {
  if (type === 'scale') {
    // Convert text ratings to numeric values
    const scaleMap: Record<string, number> = {
      'Poor': 1,
      'Fair': 2,
      'Good': 3,
      'Very Good': 4,
      'Excellent': 5
    };
    return scaleMap[value] || 3; // Default to middle value if unknown
  }
  
  return value;
}

// Helper function to remove duplicates from array based on a key
function removeDuplicates<T>(array: T[], key: keyof T): T[] {
  return Array.from(new Map(array.map(item => [item[key], item])).values());
}