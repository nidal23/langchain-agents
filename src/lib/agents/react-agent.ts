// lib/agents/react-agent.ts

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  }

  // Store the thread ID for conversation continuity
    let currentThreadId: string | null = null;

  
  const getResponse = async (userMessage: string, chatHistory?: Message[]): Promise<string> => {
    try {
      const response = await fetch('/api/react-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          threadId: currentThreadId, // Send current thread ID if we have one
          history: chatHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();

      if (data.threadId) {
        currentThreadId = data.threadId;
      }
  
      return data.content;
    } catch (error) {
      console.error("Error in ReAct Agent:", error);
      throw new Error("Failed to generate a response. Please try again.");
    }
  };
  
  export const reactAgent = {
    getResponse
  };