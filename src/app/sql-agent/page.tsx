import { ChatInterface } from '@/components/chat-interface'

export default function SQLAgentPage() {
  return (
    <div className="h-[calc(100vh-5rem)]">
      <ChatInterface 
        title="SQL Database Agent" 
        agentType="sql"
        initialMessage="Welcome! I'm an SQL Agent that can help you query databases. You can ask me questions about your data in natural language, and I'll translate them into SQL queries, execute them against your database, and provide you with the answers. Try asking something about your data!"
        placeholderText="Ask a question about your database..."
      />
    </div>
  )
}