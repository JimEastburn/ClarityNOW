import React, { useState, useRef, useEffect } from 'react'
import chatbotService from '../services/chatbot'
import './Chat.css'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface ChatProps {
  isOpen: boolean
  onToggle: () => void
}

const Chat: React.FC<ChatProps> = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your ClarityNOW AI assistant. I can help you with questions about your real estate data, agent performance, market analytics, and more. Try asking me something like 'Which agent has the most active listings?' or 'What's our total transaction volume?'",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Add loading message
    const loadingMessage: Message = {
      id: Date.now().toString() + '_loading',
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      // Call the real chatbot API
      await sendMessageToAPI(userMessage.content)
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove loading message and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingMessage.id)
        return [...filtered, {
          id: Date.now().toString(),
          type: 'assistant',
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date()
        }]
      })
    } finally {
      setIsTyping(false)
    }
  }

  const sendMessageToAPI = async (userInput: string) => {
    try {
      // Remove loading message first
      setMessages(prev => prev.filter(m => !m.isLoading))

      // Convert current messages to API format for conversation history
      const conversationHistory = chatbotService.convertUIMessagesToAPIFormat(
        messages.filter(m => !m.isLoading).map(m => ({
          type: m.type,
          content: m.content
        }))
      )

      // Call the chatbot API
      const response = await chatbotService.sendMessage(userInput, conversationHistory)

      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling chatbot API:', error)
      
      // Remove loading message and show error
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading)
        return [...filtered, {
          id: Date.now().toString(),
          type: 'assistant',
          content: error instanceof Error ? error.message : "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date()
        }]
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const quickActions = [
    "Which agent has the most active listings?",
    "What's our total transaction volume?",
    "Show me properties over $800k",
    "How many pending sales are there?"
  ]

  return (
    <div className={`chat-container ${isOpen ? 'open' : 'closed'}`}>
      {/* Chat Toggle Button */}
      <button 
        className="chat-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-icon">🤖</span>
              <span>ClarityNOW Assistant</span>
            </div>
            <button 
              className="chat-minimize"
              onClick={onToggle}
              aria-label="Minimize chat"
            >
              ↓
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`message ${message.type}`}
              >
                <div className="message-content">
                  {message.isLoading ? (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="quick-actions">
              <div className="quick-actions-title">Try asking:</div>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="quick-action"
                  onClick={() => setInputValue(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your real estate data..."
                className="chat-input"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="send-button"
                aria-label="Send message"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat