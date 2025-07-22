import OpenAI from 'openai'
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
  private openai: OpenAI
  private db: Database.Database

  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Initialize database connection
    const dbPath = path.join(__dirname, '../../data/claritynow.db')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
  }

  private getSystemPrompt(): string {
    return `You are ClarityNOW AI Assistant, a helpful AI that can answer questions about real estate data from the ClarityNOW portal database.

IMPORTANT: You can only execute READ-ONLY queries. Never attempt to modify, insert, update, or delete data.

DATABASE SCHEMA:
1. portal_data table:
   - id: INTEGER PRIMARY KEY
   - units_active, units_pending, units_closed: INTEGER (transaction counts)
   - gci_active, gci_pending, gci_closed: REAL (gross commission income)
   - volume_active, volume_pending, volume_closed: REAL (transaction volumes)
   - profits_current_month, profits_next_month, profits_total: REAL
   - monthly_profits: TEXT (JSON array of monthly profit data)
   - profit_goals: TEXT (JSON array of profit goals)
   - ratings: TEXT (JSON array of ratings data)
   - created_at, updated_at: TEXT (timestamps)

2. listings table:
   - id: INTEGER PRIMARY KEY
   - status: TEXT (Active, Pending, Sold, Expired, etc.)
   - transaction_type: TEXT (New Construction, Resale, etc.)
   - primary_agent: TEXT (agent name)
   - address: TEXT (property address)
   - unit_goal: TEXT
   - contingent_sale: TEXT (Yes/No)
   - signed_listing_date, active_listing_date, target_mls_date, date_on_market, expiration_date: TEXT (dates)
   - listing_price: REAL (property price)
   - gross_commission: REAL (commission amount)
   - team: TEXT (team name)
   - gross_profit: REAL (profit amount)
   - created_at, updated_at: TEXT (timestamps)

RESPONSE FORMAT:
When asked a question:
1. If it requires data from the database, generate a safe READ-ONLY SQL query
2. Execute the query and format the results in a natural, conversational way
3. If asked for agent performance, property analytics, market insights, or temporal queries, provide specific data
4. Always be helpful, accurate, and professional
5. If you can't answer something with the available data, explain what information is missing

QUERY SAFETY:
- Only use SELECT statements
- Use parameterized queries when needed
- Never use DROP, INSERT, UPDATE, DELETE, ALTER, or other modification commands
- Validate that all queries are read-only before execution

Examples of good responses:
- "Based on your listings data, Sarah Johnson has 12 active listings with a total value of $2.4M"
- "Your top performing agent by gross commission is John Smith with $145,000 in commissions"
- "You currently have 23 pending sales worth $4.2M in total transaction volume"

Be conversational, helpful, and always provide specific numbers and insights when available.`
  }

  private async generateSQL(userQuery: string, conversationHistory: ChatMessage[]): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      ...conversationHistory.slice(-5), // Keep last 5 messages for context
      { 
        role: 'user', 
        content: `Generate a READ-ONLY SQL query to answer this question: "${userQuery}". Return ONLY the SQL query, no explanation.` 
      }
    ]

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 200,
        temperature: 0.1
      })

      const sql = response.choices[0]?.message?.content?.trim() || ''
      
      // Validate that the query is read-only
      if (!this.isReadOnlyQuery(sql)) {
        throw new Error('Generated query is not read-only')
      }

      return sql
    } catch (error) {
      console.error('Error generating SQL:', error)
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

  private async generateResponse(userQuery: string, queryResult: QueryResult, conversationHistory: ChatMessage[]): Promise<string> {
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

    const messages: ChatMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      ...conversationHistory.slice(-4), // Keep last 4 messages for context
      { 
        role: 'user', 
        content: `User question: "${userQuery}"\n\nDatabase query results:\n${dataContext}\n\nPlease provide a helpful, conversational response based on this data. Format numbers nicely and provide insights when possible.` 
      }
    ]

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })

      return response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.'
    } catch (error) {
      console.error('Error generating response:', error)
      return 'I encountered an error while processing your request. Please try again.'
    }
  }

  async processMessage(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    try {
      // Check if this requires database access
      const needsData = this.requiresData(userMessage)
      
      if (!needsData) {
        // Handle general questions without database access
        return this.handleGeneralQuestion(userMessage, conversationHistory)
      }

      // Generate SQL query
      const sql = await this.generateSQL(userMessage, conversationHistory)
      
      // Execute query
      const queryResult = this.executeQuery(sql)
      
      // Generate response based on results
      const response = await this.generateResponse(userMessage, queryResult, conversationHistory)
      
      return response
    } catch (error) {
      console.error('Error processing message:', error)
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

  private async handleGeneralQuestion(userMessage: string, conversationHistory: ChatMessage[]): Promise<string> {
    const messages: ChatMessage[] = [
      { 
        role: 'system', 
        content: `You are ClarityNOW AI Assistant. You help with questions about the ClarityNOW real estate portal. 
                 If users ask general questions about the system or need help, provide helpful guidance.
                 Keep responses conversational and professional.` 
      },
      ...conversationHistory.slice(-3),
      { role: 'user', content: userMessage }
    ]

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      })

      return response.choices[0]?.message?.content || 'How can I help you with your ClarityNOW data today?'
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
}

export default ChatbotService