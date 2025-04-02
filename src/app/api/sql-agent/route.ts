// app/api/sql-agent/route.ts
import { NextResponse } from 'next/server';
import { SqlDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";
import path from 'path';
import { ChatOpenAI } from "@langchain/openai";
import { QuerySqlTool } from "langchain/tools/sql";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";


// Create a singleton data source
let datasource: DataSource | null = null;
let db: SqlDatabase | null = null;

// Setup state annotations
const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  query: Annotation<string>,
  result: Annotation<string>,
  answer: Annotation<string>,
});

async function initializeDatabase() {
    console.log('here in initialize db')
  if (!datasource) {
    const dbPath = path.join(process.cwd(), 'Chinook.db');
    console.log('Database path:', dbPath);
    
    datasource = new DataSource({
      type: "sqlite",
      database: dbPath,
    });
    
    await datasource.initialize();
    console.log('Database connection initialized');
    
    db = await SqlDatabase.fromDataSourceParams({
      appDataSource: datasource,
    });
  }
  return db;
}

export async function POST(request: Request) {
  try {
    const { message, threadId } = await request.json();
    console.log('Received message:', message);
    
    // Initialize the database
    const sqlDb = await initializeDatabase();
    
    // Set up the LLM
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
    
    // Define the SQL query schema
    const queryOutput = z.object({
      query: z.string().describe("Syntactically valid SQL query."),
    });
    
    // Create structured LLM for SQL generation
    const structuredLlm = llm.withStructuredOutput(queryOutput);
    
    // Step 1: Write query from natural language
    const writeQuery = async (state: typeof StateAnnotation.State) => {
      const promptTemplate = 
        "Given an input question, create a syntactically correct {dialect} query to run to help find the answer. " +
        "Unless the user specifies in their question a specific number of examples they wish to obtain, " +
        "always limit your query to at most {top_k} results. " +
        "You can order the results by a relevant column to return the most interesting examples in the database.\n\n" +
        "Never query for all the columns from a specific table, only ask for the few relevant columns given the question.\n\n" +
        "Pay attention to use only the column names that you can see in the schema description. " +
        "Be careful to not query for columns that do not exist. " +
        "Also, pay attention to which column is in which table.\n\n" +
        "Only use the following tables:\n{table_info}\n\n" +
        "Question: {input}";
        
      const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);
      
      const promptValue = await prompt.invoke({
        dialect: sqlDb?.appDataSourceOptions.type,
        top_k: 10,
        table_info: await sqlDb?.getTableInfo(),
        input: state.question,
      });
      
      const result = await structuredLlm.invoke(promptValue);
      return { query: result.query };
    };
    
    // Step 2: Execute the SQL query
    const executeQuery = async (state: typeof StateAnnotation.State) => {
      const executeQueryTool = new QuerySqlTool(sqlDb);
      return { result: await executeQueryTool.invoke(state.query) };
    };
    
    // Step 3: Generate a natural language answer
    const generateAnswer = async (state: typeof StateAnnotation.State) => {
      const promptValue =
        "Given the following user question, corresponding SQL query, " +
        "and SQL result, answer the user question.\n\n" +
        `Question: ${state.question}\n` +
        `SQL Query: ${state.query}\n` +
        `SQL Result: ${state.result}\n`;
      const response = await llm.invoke(promptValue);
      return { answer: response.content };
    };
    
    // Build the graph
    const graphBuilder = new StateGraph({
      stateSchema: StateAnnotation,
    })
      .addNode("writeQuery", writeQuery)
      .addNode("executeQuery", executeQuery)
      .addNode("generateAnswer", generateAnswer)
      .addEdge("__start__", "writeQuery")
      .addEdge("writeQuery", "executeQuery")
      .addEdge("executeQuery", "generateAnswer")
      .addEdge("generateAnswer", "__end__");
    
    const graph = graphBuilder.compile();
    
    // Execute the graph with the user's question
    const result = await graph.invoke({ 
      question: message,
      query: "",
      result: "",
      answer: ""
    });
    
    console.log('Graph result:', result);
    
    return NextResponse.json({
      content: result.answer,
      threadId: threadId || Date.now().toString()
    });
  } catch (error) {
    console.error("Error in SQL Agent:", error);
    return NextResponse.json(
      { error: "Failed to process query: " + error.message },
      { status: 500 }
    );
  }
}