import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null as any;

// Type definitions for our database schema
export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    section: string;
    subsection?: string;
    page: number;
    variation_type?: string;
    document_type?: string;
  };
  created_at: string;
}

// Search for relevant chunks using vector similarity
export async function searchDocuments(
  queryEmbedding: number[],
  matchCount: number = 5,
  matchThreshold: number = 0.7
) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    match_threshold: matchThreshold,
  });

  if (error) {
    console.error("Error searching documents:", error);
    throw error;
  }

  return data;
}

// Insert document chunks with embeddings
export async function insertDocumentChunks(chunks: Omit<DocumentChunk, "id" | "created_at">[]) {
  const { data, error } = await supabase
    .from("document_chunks")
    .insert(chunks)
    .select();

  if (error) {
    console.error("Error inserting document chunks:", error);
    throw error;
  }

  return data;
}

// Get all document chunks (for full context injection)
export async function getAllDocumentChunks(): Promise<DocumentChunk[]> {
  const { data, error } = await supabase
    .from("document_chunks")
    .select("*")
    .order("metadata->page", { ascending: true });

  if (error) {
    console.error("Error fetching all document chunks:", error);
    throw error;
  }

  return data as DocumentChunk[];
}
