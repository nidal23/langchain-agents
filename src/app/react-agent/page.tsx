import { ChatInterface } from '@/components/chat-interface'

export default function ReActAgentPage() {
  return (
    <div className="h-[calc(100vh-5rem)]">
      <ChatInterface 
        title="ReAct Agent with Web Search" 
        agentType="react"
        initialMessage="Hello! I'm a ReAct Agent that can search the web using the Tavily API. You can ask me questions, and I'll think step-by-step, search for information, and provide you with answers based on the latest information from the web."
        placeholderText="Ask me anything that requires web search..."
      />
    </div>
  )
}