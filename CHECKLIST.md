# Setup Checklist

Follow this checklist to get your SFDA Compliance Assistant up and running.

## ☐ Step 1: Clone/Setup Project

- [x] Project created with Next.js
- [ ] Dependencies installed (`npm install`)

## ☐ Step 2: Supabase Setup

- [ ] Created Supabase account at [supabase.com](https://supabase.com)
- [ ] Created new Supabase project
- [ ] Copied project URL to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copied anon key to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copied service role key to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Opened SQL Editor in Supabase dashboard
- [ ] Ran the complete `supabase-schema.sql` file
- [ ] Verified `document_chunks` table was created
- [ ] Verified `match_documents` function was created

## ☐ Step 3: Google AI Setup

- [ ] Visited [Google AI Studio](https://aistudio.google.com/app/apikey)
- [ ] Created API key
- [ ] Copied API key to `.env.local` as `GOOGLE_API_KEY`
- [ ] Verified API key has access to:
  - [ ] Gemini 1.5 Pro model
  - [ ] text-embedding-004 model

## ☐ Step 4: Document Preparation

- [ ] Located SFDA Variation Guidelines PDF
- [ ] Created `documents/` folder in project root
- [ ] Copied PDF to `documents/Variation.pdf`
- [ ] Verified file exists and is readable

## ☐ Step 5: Process Documents

- [ ] Ran `npm run process-docs`
- [ ] Waited for processing to complete (10-20 minutes)
- [ ] Verified no errors occurred
- [ ] Checked Supabase table has data:
  - Open Supabase dashboard
  - Go to Table Editor
  - Select `document_chunks` table
  - Verify rows exist with content and embeddings

## ☐ Step 6: Test the Application

- [ ] Ran `npm run dev`
- [ ] Opened [http://localhost:3000](http://localhost:3000)
- [ ] Verified landing page loads
- [ ] Clicked on "Chat Assistant"
- [ ] Tried a sample question
- [ ] Verified response includes sources

## ☐ Step 7: Deploy (Optional)

- [ ] Pushed code to GitHub
- [ ] Created Vercel account
- [ ] Imported project to Vercel
- [ ] Added all environment variables in Vercel
- [ ] Deployed application
- [ ] Tested deployed version

## Troubleshooting

### No response from chat

**Check:**
- [ ] `.env.local` file exists and has all variables
- [ ] Google API key is valid
- [ ] Supabase credentials are correct
- [ ] Document processing completed successfully
- [ ] Browser console for specific errors

### Document processing fails

**Check:**
- [ ] PDF file is in correct location (`documents/Variation.pdf`)
- [ ] PDF is not corrupted
- [ ] Supabase table and function exist
- [ ] Google API has embedding access
- [ ] No rate limit errors

### Vector search returns empty

**Check:**
- [ ] Document processing completed without errors
- [ ] `document_chunks` table has data in Supabase
- [ ] Embeddings column is populated (not null)
- [ ] `match_documents` function exists in Supabase

## Environment Variables Template

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API
GOOGLE_API_KEY=AIzaSy...

# Embedding Model (Don't change unless you know what you're doing)
EMBEDDING_MODEL=text-embedding-gecko-multilingual@001
```

## Need Help?

- Review [SETUP.md](./SETUP.md) for detailed instructions
- Check [README.md](./README.md) for architecture details
- Check browser console for client-side errors
- Check terminal for server-side errors
- Verify all environment variables are set correctly
