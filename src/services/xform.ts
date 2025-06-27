import { Form } from 'enketo-core'

export interface XFormData {
  [key: string]: any
}

export interface XFormConfig {
  xmlPath: string
  instanceId?: string
  interviewerName?: string
}

export class XFormService {
  private form: Form | null = null
  private xmlContent: string = ''
  private config: XFormConfig

  constructor(config: XFormConfig) {
    this.config = config
  }

  /**
   * Load XForm XML from file system
   */
  async loadXForm(): Promise<void> {
    try {
      // Load XML file content
      const response = await fetch(this.config.xmlPath)
      if (!response.ok) {
        throw new Error(`Failed to load XForm: ${response.statusText}`)
      }
      
      this.xmlContent = await response.text()
      console.log('✅ XForm XML loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load XForm XML:', error)
      throw error
    }
  }

  /**
   * Initialize Enketo Form instance
   */
  async initializeForm(container: HTMLElement): Promise<void> {
    if (!this.xmlContent) {
      throw new Error('XForm XML not loaded. Call loadXForm() first.')
    }

    try {
      // Parse XML and extract form HTML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(this.xmlContent, 'text/xml')

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror')
      if (parseError) {
        throw new Error(`XML parsing error: ${parseError.textContent}`)
      }

      // Extract the HTML form from the XForm
      const htmlForm = xmlDoc.querySelector('h\\:body, body')
      if (!htmlForm) {
        throw new Error('No form body found in XForm')
      }

      // Create form HTML structure
      const formHtml = `
        <form class="or">
          ${htmlForm.innerHTML}
        </form>
      `

      // Insert form HTML into container and add unique ID
      const formId = `enketo-form-${Date.now()}`
      const formHtmlWithId = formHtml.replace('<form class="or">', `<form class="or" id="${formId}">`)
      container.innerHTML = formHtmlWithId

      // Create Enketo Form instance with the form selector
      this.form = new Form(`#${formId}`, {
        modelStr: this.xmlContent,
        instanceStr: this.generateInitialInstance(),
        external: [],
        submitted: false
      })

      // Initialize the form
      await this.form.init()

      console.log('✅ Enketo form initialized successfully')

      // Auto-populate interviewer name if provided
      if (this.config.interviewerName) {
        this.setInterviewerName(this.config.interviewerName)
      }
    } catch (error) {
      console.error('❌ Failed to initialize Enketo form:', error)
      throw error
    }
  }

  /**
   * Generate initial instance data for the form
   */
  private generateInitialInstance(): string {
    const instanceId = this.config.instanceId || `interview_${Date.now()}`
    
    return `<?xml version="1.0" encoding="UTF-8"?>
      <data id="${instanceId}">
        <interviewer_name>${this.config.interviewerName || ''}</interviewer_name>
        <start_time>${new Date().toISOString()}</start_time>
      </data>`
  }

  /**
   * Set interviewer name in the form
   */
  setInterviewerName(name: string): void {
    if (!this.form) {
      console.warn('Form not initialized')
      return
    }

    try {
      // Find interviewer name field and set value
      const interviewerField = this.form.view.html.querySelector('[name="interviewer_name"]')
      if (interviewerField) {
        (interviewerField as HTMLInputElement).value = name
        // Trigger change event to update form model
        interviewerField.dispatchEvent(new Event('change', { bubbles: true }))
        console.log('✅ Interviewer name set:', name)
      }
    } catch (error) {
      console.error('❌ Failed to set interviewer name:', error)
    }
  }

  /**
   * Get current form data
   */
  getFormData(): XFormData | null {
    if (!this.form) {
      console.warn('Form not initialized')
      return null
    }

    try {
      const data = this.form.getDataStr()
      console.log('📊 Form data retrieved:', data)
      return this.parseXMLToObject(data)
    } catch (error) {
      console.error('❌ Failed to get form data:', error)
      return null
    }
  }

  /**
   * Validate form data
   */
  async validateForm(): Promise<boolean> {
    if (!this.form) {
      console.warn('Form not initialized')
      return false
    }

    try {
      const isValid = await this.form.validate()
      console.log('🔍 Form validation result:', isValid)
      return isValid
    } catch (error) {
      console.error('❌ Form validation failed:', error)
      return false
    }
  }

  /**
   * Parse XML string to JavaScript object
   */
  private parseXMLToObject(xmlStr: string): XFormData {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml')
    const result: XFormData = {}

    const extractData = (node: Element, obj: any): void => {
      for (const child of Array.from(node.children)) {
        const tagName = child.tagName
        if (child.children.length > 0) {
          obj[tagName] = {}
          extractData(child, obj[tagName])
        } else {
          obj[tagName] = child.textContent || ''
        }
      }
    }

    if (xmlDoc.documentElement) {
      extractData(xmlDoc.documentElement, result)
    }

    return result
  }

  /**
   * Destroy form instance and clean up
   */
  destroy(): void {
    if (this.form) {
      // Clean up form instance
      this.form = null
      console.log('🧹 XForm service destroyed')
    }
  }

  /**
   * Check if form is initialized
   */
  isInitialized(): boolean {
    return this.form !== null
  }

  /**
   * Get form validation errors
   */
  getValidationErrors(): string[] {
    if (!this.form) {
      return ['Form not initialized']
    }

    try {
      // Get validation errors from Enketo form
      const errors: string[] = []
      const invalidElements = this.form.view.html.querySelectorAll('.invalid-constraint, .invalid-required')
      
      invalidElements.forEach((element: Element) => {
        const label = element.closest('.question')?.querySelector('label')?.textContent
        const errorMsg = element.querySelector('.or-constraint-msg, .or-required-msg')?.textContent
        if (label && errorMsg) {
          errors.push(`${label}: ${errorMsg}`)
        }
      })

      return errors
    } catch (error) {
      console.error('❌ Failed to get validation errors:', error)
      return ['Failed to retrieve validation errors']
    }
  }
}

/**
 * Factory function to create XForm service instance
 */
export function createXFormService(config: XFormConfig): XFormService {
  return new XFormService(config)
}

/**
 * Helper function to load XForm from local file system
 */
export async function loadXFormFromFile(filePath: string): Promise<string> {
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    console.error('❌ Failed to load XForm file:', error)
    throw error
  }
}
