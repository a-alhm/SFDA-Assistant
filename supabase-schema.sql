-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create a table to store document chunks with embeddings
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(768), -- text-embedding-004 produces 768-dimensional vectors
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for faster similarity searches
create index on document_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create a function to search for similar documents
create or replace function match_documents (
  query_embedding vector(768),
  match_count int default 5,
  match_threshold float default 0.7
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create an index on the metadata for faster filtering
create index on document_chunks using gin (metadata);

-- Create RLS (Row Level Security) policies
alter table document_chunks enable row level security;

-- Allow anonymous read access (adjust based on your security requirements)
create policy "Allow anonymous read access"
  on document_chunks
  for select
  to anon
  using (true);

-- Allow service role to insert/update/delete
create policy "Allow service role full access"
  on document_chunks
  for all
  to service_role
  using (true);
