// app/api/react-agent/route.ts
import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
  } from "@langchain/langgraph";

  const memory = new MemorySaver();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('body: ', body)
    const { message, threadId: existingThreadId } = body;
    
    const openai_api = process.env.OPENAI_API_KEY;
    
    if (!openai_api) {
      return NextResponse.json(
        { error: "OpenAI API key is missing" }, 
        { status: 500 }
      );
    }
    
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: openai_api
    });

    const callModel = async (state: typeof MessagesAnnotation.State) => {
        console.log('state message inside call model: ', state.messages)
        const response = await llm.invoke(state.messages);
        return { messages: response }
    };

    const workflow = new StateGraph(MessagesAnnotation)
        .addNode("model", callModel)
        .addEdge(START, "model")
        .addEdge("model", END)

    const app = workflow.compile({ checkpointer: memory });

    const input = [
        {
            role: "user",
            content: message,
        },
    ]

    console.log('input: ', input)

    const threadId = existingThreadId || Date.now().toString();

    console.log('thread id: ', threadId)


    // const config = { configurable: { thread_id: threadId }};


    
    const response = await app.invoke(
        { 
          messages: input 
        }, 
        { 
          configurable: { 
            thread_id: threadId 
          } 
        }
      );
    // When returning the response:
    const aiMessage = response.messages[response.messages.length - 1];

    console.log('ai response: ', aiMessage)

    // Make sure we're returning just the content string, not the full message object
    return NextResponse.json({ 
    content: typeof aiMessage.content === 'string' ? aiMessage.content : JSON.stringify(aiMessage.content),
    threadId: threadId 
    });

  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Failed to generate a response" }, 
      { status: 500 }
    );
  }
}