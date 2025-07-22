import express from 'express'
import ChatbotService from '../services/chatbot'

const router = express.Router()
const chatbotService = new ChatbotService()

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  message: string
  conversationHistory?: ChatMessage[]
}

// POST /api/chatbot/message - Send a message to the chatbot
router.post('/message', async (req, res) => {
  try {
    const { message, conversationHistory = [] }: ChatRequest = req.body

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string'
      })
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: 'Message is too long. Please keep it under 1000 characters.'
      })
    }

    // Validate conversation history
    if (!Array.isArray(conversationHistory)) {
      return res.status(400).json({
        error: 'Conversation history must be an array'
      })
    }

    // Process the message
    const response = await chatbotService.processMessage(message, conversationHistory)

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chatbot API error:', error)
    res.status(500).json({
      error: 'Internal server error. Please try again.',
      success: false
    })
  }
  return
})

// GET /api/chatbot/schema - Get database schema info (for debugging)
router.get('/schema', async (req, res) => {
  try {
    const schemaInfo = chatbotService.getSchemaInfo()
    res.json({
      success: true,
      schema: schemaInfo
    })
  } catch (error) {
    console.error('Schema API error:', error)
    res.status(500).json({
      error: 'Failed to retrieve schema information',
      success: false
    })
  }
  return
})

// GET /api/chatbot/health - Health check for chatbot service
router.get('/health', async (req, res) => {
  try {
    // Test if OpenAI API key is configured
    const hasApiKey = !!process.env.OPENAI_API_KEY
    
    res.json({
      success: true,
      status: 'Chatbot service is running',
      openai_configured: hasApiKey,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chatbot health check error:', error)
    res.status(500).json({
      error: 'Chatbot service health check failed',
      success: false
    })
  }
  return
})

export default router