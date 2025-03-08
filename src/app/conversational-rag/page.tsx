import { ChatInterface } from '@/components/chat-interface'

export default function ConversationalRAGPage() {
  return (
    <div className="h-[calc(100vh-5rem)]">
      <ChatInterface 
        title="Conversational RAG" 
        agentType="rag"
        initialMessage="Hi there! I'm a Conversational RAG (Retrieval-Augmented Generation) agent. I can have contextual conversations by remembering our previous exchanges and retrieving relevant information from documents. Let's have a chat, and I'll maintain context throughout our conversation."
        placeholderText="Ask me a question about a topic..."
      />
    </div>
  )
}