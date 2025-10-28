# SFDA Regulatory Compliance Assistant

An intelligent chatbot assistant for navigating Saudi Food & Drug Authority (SFDA) regulations and compliance requirements, specifically focused on the Guidelines for Variation Requirements.

## Features

### ✅ Implemented

- **Landing Page**: Clean interface with two main options
  - Chat Assistant (Active)
  - Compliance Evaluation (Coming Soon)

- **Chat Assistant**: RAG-powered Q&A system
  - Ask questions about SFDA variation requirements
  - Get accurate answers based on official documentation
  - Source citations for transparency
  - Conversation history support
  - Suggested questions to get started

- **Backend Architecture**
  - Next.js API routes (no direct frontend → service communication)
  - Supabase Vector database for semantic search
  - Google Gemini 1.5 Pro for chat responses
  - Google text-embedding-004 for embeddings
  - Intelligent document chunking with metadata preservation

### 🚧 Coming Soon

- **Compliance Evaluation**: Agentic document analysis
  - Upload company documents
  - Multi-agent analysis system
  - Gap analysis and compliance scoring
  - Structured outputs using Instructor.js

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Prerequisites

- Node.js 18+
- Supabase account
- Google Cloud account (Gemini API access)
- SFDA Variation Guidelines PDF

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.local and fill in your credentials

# Set up Supabase database
# Run the SQL in supabase-schema.sql in your Supabase SQL Editor

# Process documents
npm run process-docs

# Start development server
npm run dev
```

## Project Structure

```
sfda-compliance/
├── app/
│   ├── page.tsx              # Landing page
│   ├── chat/
│   │   └── page.tsx          # Chat interface
│   └── api/
│       └── chat/
│           └── route.ts      # Chat API endpoint
├── lib/
│   ├── supabase.ts           # Supabase client & utilities
│   └── gemini.ts             # Gemini AI integration
├── scripts/
│   └── process-documents.ts  # Document chunking & embedding
├── documents/
│   └── Variation.pdf         # Place SFDA PDF here
├── supabase-schema.sql       # Database schema
└── .env.local                # Environment variables
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **Vector Database**: Supabase (PostgreSQL + pgvector)
- **Embeddings**: Google text-embedding-004
- **LLM**: Google Gemini 1.5 Pro
- **Document Processing**: pdf-parse
- **Language**: TypeScript

## Architecture

### RAG Pipeline

1. **User Query** → Sent to `/api/chat`
2. **Query Embedding** → Generated using Google embeddings
3. **Vector Search** → Semantic search in Supabase
4. **Context Retrieval** → Top 5 relevant chunks
5. **LLM Generation** → Gemini generates response with context
6. **Response + Citations** → Returned to frontend

### Key Design Principles

- **No Direct Service Access**: Frontend only calls Next.js API routes
- **Server-Side Processing**: All AI/DB operations happen server-side
- **Source Attribution**: Every response includes source citations
- **Intelligent Chunking**: Preserves document structure and metadata

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Google Gemini
GOOGLE_API_KEY=AIzxxx...

# Model Configuration
EMBEDDING_MODEL=text-embedding-004
CHAT_MODEL=gemini-pro
```

## Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Process documents
npm run process-docs [path-to-pdf]
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Important Notes

- Make sure to run `npm run process-docs` before deployment to populate the database
- Supabase database must be accessible from your deployment environment
- Set all environment variables in your deployment platform

## API Endpoints

### POST `/api/chat`

Chat with the SFDA assistant.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are Type IA variations?"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Type IA variations are...",
  "sources": [
    "Section II: Quality Changes (Page 15)",
    "Table 1: Variation Types (Page 8)"
  ]
}
```

## Contributing

This is a prototype. For production use, consider:

- Adding authentication
- Implementing rate limiting
- Adding monitoring and logging
- Improving error handling
- Adding tests
- Implementing re-ranking for better results
- Caching frequent queries

## License

MIT

## Support

For detailed setup instructions, see [SETUP.md](./SETUP.md)
