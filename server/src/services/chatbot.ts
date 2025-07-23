import Anthropic from '@anthropic-ai/sdk'
import Database from 'better-sqlite3'
import path from 'path'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface QueryResult {
  success: boolean
  data?: any[]
  error?: string
  sql?: string
}

class ChatbotService {
  private anthropic: Anthropic | null = null
  private db: Database.Database

  constructor() {
    // Initialize database connection
    const dbPath = path.join(__dirname, '../../data/claritynow.db')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
  }

  private getAnthropicClient(): Anthropic {
    if (!this.anthropic) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key is not configured. Please set ANTHROPIC_API_KEY environment variable.')
      }
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    }
    return this.anthropic
  }

  private getSystemPrompt(): string {
    return `You are a SQL query generator for a real estate database. Generate ONLY SELECT queries.

DATABASE TABLES:
- listings: id, status, primary_agent, address, listing_price, gross_commission, team, gross_profit, transaction_type, contingent_sale, created_at
- portal_data: id, units_active, units_pending, units_closed, gci_active, gci_pending, gci_closed, volume_active, volume_pending, volume_closed

RULES:
- Only generate SELECT statements
- Use proper SQL syntax
- Return ONLY the SQL query, no explanations
- Use COUNT, GROUP BY, ORDER BY as needed
- For "most active listings" queries, use: SELECT primary_agent, COUNT(*) as listing_count FROM listings WHERE status = 'Active' GROUP BY primary_agent ORDER BY listing_count DESC LIMIT 1`
  }

  private async generateSQL(userQuery: string): Promise<string> {
    try {
      const anthropic = this.getAnthropicClient()
      
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: `Question: "${userQuery}"\nSQL:`
          }
        ]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        const sql = content.text.trim()
        
        // Validate that the query is read-only
        if (!this.isReadOnlyQuery(sql)) {
          throw new Error('Generated query is not read-only')
        }

        return sql
      }
      
      throw new Error('No text content in response')
    } catch (error) {
      console.error('Error generating SQL:', error)
      if (error instanceof Error) {
        console.error('SQL generation error details:', error.message)
        throw new Error(`Failed to generate database query: ${error.message}`)
      }
      throw new Error('Failed to generate database query')
    }
  }

  private isReadOnlyQuery(sql: string): boolean {
    const normalizedSQL = sql.toLowerCase().trim()
    
    // Check if it starts with SELECT
    if (!normalizedSQL.startsWith('select')) {
      return false
    }

    // Check for dangerous keywords
    const dangerousKeywords = [
      'insert', 'update', 'delete', 'drop', 'alter', 'create', 
      'truncate', 'replace', 'exec', 'execute', 'grant', 'revoke'
    ]

    return !dangerousKeywords.some(keyword => 
      normalizedSQL.includes(keyword.toLowerCase())
    )
  }

  private executeQuery(sql: string): QueryResult {
    try {
      console.log('Executing SQL:', sql)
      const stmt = this.db.prepare(sql)
      const data = stmt.all()
      
      return {
        success: true,
        data,
        sql
      }
    } catch (error) {
      console.error('Database query error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
        sql
      }
    }
  }

  private async generateResponse(userQuery: string, queryResult: QueryResult): Promise<string> {
    let dataContext = ''
    
    if (queryResult.success && queryResult.data) {
      if (queryResult.data.length === 0) {
        dataContext = 'No data found for this query.'
      } else {
        dataContext = `Query results: ${JSON.stringify(queryResult.data, null, 2)}`
      }
    } else {
      dataContext = `Database error: ${queryResult.error}`
    }

    try {
      const anthropic = this.getAnthropicClient()
      
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: `You are ClarityNOW AI Assistant. Provide conversational responses about real estate data questions. Format numbers nicely and do not provide insights, only report the data. Do not begin the response with statements like ' Based on the data provided' or 'Based on the information provided' or 'According to the data'`,
        messages: [
          {
            role: 'user',
            content: `User question: "${userQuery}"\n\nDatabase query results:\n${dataContext}\n\nPlease provide a helpful, conversational response based on this data.`
          }
        ]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      
      return 'I apologize, but I was unable to generate a response.'
    } catch (error) {
      console.error('Error generating response:', error)
      return 'I encountered an error while processing your request. Please try again.'
    }
  }

  async processMessage(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    try {
      console.log('Processing message:', userMessage)
      
      // Check if this requires database access
      const needsData = this.requiresData(userMessage)
      console.log('Needs data:', needsData)
      
      if (!needsData) {
        // Handle general questions without database access
        return this.handleGeneralQuestion(userMessage)
      }

      console.log('Generating SQL query...')
      // Generate SQL query
      const sql = await this.generateSQL(userMessage)
      console.log('Generated SQL:', sql)
      
      console.log('Executing query...')
      // Execute query
      const queryResult = this.executeQuery(sql)
      console.log('Query result:', queryResult.success ? 'Success' : `Error: ${queryResult.error}`)
      
      console.log('Generating response...')
      // Generate response based on results
      const response = await this.generateResponse(userMessage, queryResult)
      console.log('Response generated successfully')
      
      return response
    } catch (error) {
      console.error('Error processing message:', error)
      if (error instanceof Error) {
        console.error('Error details:', error.message)
        console.error('Stack trace:', error.stack)
        return `I encountered an error: ${error.message}. Please try again or rephrase your question.`
      }
      return 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.'
    }
  }

  private requiresData(message: string): boolean {
    const dataKeywords = [
      'agent', 'listing', 'property', 'commission', 'profit', 'volume', 
      'sales', 'transaction', 'active', 'pending', 'sold', 'price',
      'how many', 'show me', 'what is', 'total', 'average', 'top',
      'performance', 'analytics', 'market', 'team'
    ]
    
    const lowerMessage = message.toLowerCase()
    return dataKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  private async handleGeneralQuestion(userMessage: string): Promise<string> {
    try {
      const anthropic = this.getAnthropicClient()
      
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: `You are ClarityNOW AI Assistant. You help with questions about the ClarityNOW real estate portal. If users ask general questions about the system or need help, provide helpful guidance. Keep responses conversational and professional.`,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      
      return 'How can I help you with your ClarityNOW data today?'
    } catch (error) {
      console.error('Error handling general question:', error)
      return 'I\'m here to help you with questions about your real estate data. What would you like to know?'
    }
  }

  // Get database schema information for debugging
  getSchemaInfo(): any {
    try {
      const portalSchema = this.db.prepare("PRAGMA table_info(portal_data)").all()
      const listingsSchema = this.db.prepare("PRAGMA table_info(listings)").all()
      
      return {
        portal_data: portalSchema,
        listings: listingsSchema
      }
    } catch (error) {
      console.error('Error getting schema info:', error)
      return { error: 'Failed to retrieve schema information' }
    }
  }

  // Check if Anthropic API is configured
  isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY
  }
}

export default ChatbotService