'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'
import { reactAgent } from '@/lib/agents/react-agent'

// Define message type
type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

type ChatInterfaceProps = {
  title: string
  agentType: 'react' | 'rag' | 'sql'
  placeholderText?: string
  initialMessage?: string
}

export function ChatInterface({
  title,
  agentType,
  placeholderText = 'Type your message here...',
  initialMessage,
}: ChatInterfaceProps) {
  // State for messages
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessage) {
      return [
        {
          id: '0',
          content: initialMessage,
          role: 'assistant',
          timestamp: new Date(),
        },
      ]
    }
    return []
  })
  
  // Input state
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Function to simulate agent response
  const getAgentResponse = async (userMessage: string) => {
    setIsLoading(true)
    
    try {
      let response;
      
      switch (agentType) {
        case 'react':
          response = await reactAgent.getResponse(userMessage);
          break;
        // case 'rag':
        //   response = await ragAgent.getResponse(userMessage, messages);
        //   break;
        // case 'sql':
        //   response = await sqlAgent.getResponse(userMessage, messages);
          break;
      }
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error getting agent response:', error);
      // Handle error, maybe add an error message to the chat
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() === '' || isLoading) return
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: 'user' as const,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    // Get agent response
    await getAgentResponse(input)
  }
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  return (
    <Card className="flex flex-col h-full border-none shadow-none">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    'p-3 rounded-lg max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted mr-auto'
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="mt-1 text-xs opacity-50">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholderText}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}