interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatResponse {
  success: boolean
  response?: string
  error?: string
  timestamp?: string
}

interface ChatbotHealthResponse {
  success: boolean
  status?: string
  openai_configured?: boolean
  error?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ChatbotService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/chatbot`
  }

  async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory
        })
      })

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Invalid request')
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const data: ChatResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred')
      }

      return data.response || 'No response received'
    } catch (error) {
      console.error('Error sending message to chatbot:', error)
      
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Network error. Please check your connection.')
      }
    }
  }

  async checkHealth(): Promise<ChatbotHealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error checking chatbot health:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getSchema(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/schema`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.schema
    } catch (error) {
      console.error('Error getting schema:', error)
      throw error
    }
  }

  // Helper method to convert UI messages to API format
  convertUIMessagesToAPIFormat(messages: Array<{ type: 'user' | 'assistant', content: string }>): ChatMessage[] {
    return messages.map(msg => ({
      role: msg.type,
      content: msg.content
    }))
  }
}

export default new ChatbotService()
export type { ChatMessage, ChatResponse, ChatbotHealthResponse }