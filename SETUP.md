# SFDA Regulatory Compliance Assistant - Setup Guide

This guide will walk you through setting up the SFDA Regulatory Compliance Assistant from scratch.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Google Cloud account with Gemini API access
- The SFDA Variation Guidelines PDF document

## Step 1: Environment Setup

1. Copy `.env.local` and fill in your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GOOGLE_API_KEY=your_google_api_key

# Model Configuration
# Embedding model for document processing and semantic search
EMBEDDING_MODEL=text-embedding-004
# Chat model for generating responses
CHAT_MODEL=gemini-pro
```

### Getting Supabase Credentials:

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (2-3 minutes)
3. Go to Project Settings > API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Getting Google API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key → `GOOGLE_API_KEY`

## Step 2: Database Setup

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the entire contents of `supabase-schema.sql` and paste it
5. Click "Run" to execute the SQL

This will:
- Enable the `pgvector` extension
- Create the `document_chunks` table
- Create the vector similarity search function
- Set up proper indexes and security policies

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Process the SFDA Document

1. Create a `documents` folder in the project root:
```bash
mkdir documents
```

2. Copy your SFDA Variation Guidelines PDF into the `documents` folder and name it `Variation.pdf`

3. Run the document processing script:
```bash
npm run process-docs
```

This will:
- Parse the PDF document
- Chunk it intelligently (preserving sections and context)
- Generate embeddings for each chunk using Google's embedding model
- Store everything in your Supabase database

**Note:** This process may take 10-20 minutes depending on the document size, as it processes each chunk sequentially to avoid rate limits.

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture Overview

### Frontend (Client-Side)
- **Landing Page** (`/`): Two options - Chat (active) and Compliance Evaluation (coming soon)
- **Chat Page** (`/chat`): Interactive chat interface with message history
- **No direct API calls**: Frontend only communicates with Next.js API routes

### Backend (Server-Side - API Routes)
- **POST `/api/chat`**: Handles all chat interactions
  1. Receives user message
  2. Generates embedding for the query
  3. Performs vector similarity search in Supabase
  4. Retrieves relevant document chunks
  5. Sends context + query to Gemini API
  6. Returns AI response with source citations

### Services Layer (`/lib`)
- **`gemini.ts`**: Gemini API integration (embeddings + chat)
- **`supabase.ts`**: Database operations and vector search

### Data Processing (`/scripts`)
- **`process-documents.ts`**: One-time script to process and embed PDF documents

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Vector Database**: Supabase (PostgreSQL + pgvector)
- **Embeddings**: Google text-embedding-004
- **LLM**: Google Gemini 1.5 Pro
- **Document Processing**: pdf-parse
- **Deployment**: Vercel (recommended)

## RAG Pipeline Flow

1. **User Query** → Frontend sends to `/api/chat`
2. **Embedding Generation** → Convert query to vector using Google embeddings
3. **Vector Search** → Find top 5 most similar document chunks from Supabase
4. **Context Assembly** → Combine retrieved chunks with proper formatting
5. **LLM Generation** → Send context + query to Gemini for response
6. **Response** → Return answer with source citations to frontend

## Troubleshooting

### "Failed to fetch" error in chat
- Check that your `.env.local` file has all required variables
- Verify your Google API key is valid
- Check browser console for specific error messages

### Document processing fails
- Ensure the PDF is in the correct location (`documents/Variation.pdf`)
- Check that your Supabase credentials are correct
- Verify the database schema was created successfully

### Vector search returns no results
- Make sure the document processing completed successfully
- Check that embeddings were stored (query `document_chunks` table in Supabase)
- Adjust the `match_threshold` parameter in the search function

## Next Steps

- [ ] Test the chat with various queries about SFDA regulations
- [ ] Implement compliance evaluation feature with Instructor.js
- [ ] Add re-ranking for better search results
- [ ] Deploy to Vercel
- [ ] Add authentication if needed

## Support

For issues or questions, check:
- Supabase docs: https://supabase.com/docs
- Gemini API docs: https://ai.google.dev/docs
- Next.js docs: https://nextjs.org/docs
