// Load environment variables FIRST, before any other imports
import { config } from "dotenv";
config({ path: require("path").join(process.cwd(), ".env") });

import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { generateEmbedding } from "../lib/gemini";
import { insertDocumentChunks } from "../lib/supabase";

interface Chunk {
  content: string;
  metadata: {
    section: string;
    subsection?: string;
    page: number;
    variation_type?: string;
    document_type?: string;
  };
}

// Hierarchical chunking strategy for regulatory documents
function chunkDocument(text: string, pageNumber: number): Chunk[] {
  const chunks: Chunk[] = [];

  // Split by major sections while preserving headers
  const sectionPattern = /(?=(?:Section|SECTION|Chapter|CHAPTER)\s+[IVX\d]+)/g;
  const sections = text.split(sectionPattern).filter(s => s.trim().length > 0);

  for (const section of sections) {
    // Extract section header
    const sectionMatch = section.match(/^(?:Section|SECTION|Chapter|CHAPTER)\s+([IVX\d]+)[:\s]+(.+?)(?:\n|$)/);
    const sectionName = sectionMatch ? `Section ${sectionMatch[1]}: ${sectionMatch[2].trim()}` : "General";

    // Further chunk large sections into paragraphs (max 1000 chars per chunk)
    const paragraphs = section.split(/\n\s*\n/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      // If adding this paragraph would exceed chunk size, save current chunk
      if (currentChunk.length + trimmedParagraph.length > 1000 && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            section: sectionName,
            page: pageNumber,
            document_type: "SFDA Variation Guidelines v6.3"
          }
        });
        currentChunk = "";
      }

      currentChunk += trimmedParagraph + "\n\n";
    }

    // Save remaining content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          section: sectionName,
          page: pageNumber,
          document_type: "SFDA Variation Guidelines v6.3"
        }
      });
    }
  }

  return chunks;
}

// Detect variation types in content
function detectVariationType(content: string): string | undefined {
  const typeIA = /Type\s+IA|variation\s+IA|IA\s+variation/i;
  const typeIAIN = /Type\s+IAIN|variation\s+IAIN|IAIN\s+variation/i;
  const typeIB = /Type\s+IB|variation\s+IB|IB\s+variation/i;
  const typeII = /Type\s+II|variation\s+II|II\s+variation/i;

  if (typeIAIN.test(content)) return "IAIN";
  if (typeIA.test(content)) return "IA";
  if (typeIB.test(content)) return "IB";
  if (typeII.test(content)) return "II";

  return undefined;
}

async function processPDF(pdfPath: string) {
  console.log("📄 Reading PDF file...");
  const dataBuffer = fs.readFileSync(pdfPath);

  console.log("🔍 Parsing PDF...");
  const parser = new PDFParse({ data: dataBuffer });
  const pdfData = await parser.getText();

  console.log(`📊 Total pages: ${pdfData.pages.length}`);
  console.log("✂️  Chunking document...");

  const allChunks: Chunk[] = [];

  // Process each page individually
  pdfData.pages.forEach((page: any, index: number) => {
    const pageChunks = chunkDocument(page.text, index + 1);

    // Enhance chunks with variation type detection
    pageChunks.forEach(chunk => {
      const variationType = detectVariationType(chunk.content);
      if (variationType) {
        chunk.metadata.variation_type = variationType;
      }
    });

    allChunks.push(...pageChunks);
  });

  console.log(`📦 Created ${allChunks.length} chunks`);
  console.log("🔢 Generating embeddings...");

  // Generate embeddings for each chunk
  const chunksWithEmbeddings = [];

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    console.log(`  Processing chunk ${i + 1}/${allChunks.length}...`);

    try {
      const embedding = await generateEmbedding(chunk.content);
      chunksWithEmbeddings.push({
        content: chunk.content,
        embedding: embedding,
        metadata: chunk.metadata
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  ❌ Error processing chunk ${i + 1}:`, error);
      // Continue with next chunk
    }
  }

  console.log(`✅ Generated ${chunksWithEmbeddings.length} embeddings`);
  console.log("💾 Storing in Supabase...");

  // Insert in batches to avoid payload size limits
  const batchSize = 10;
  for (let i = 0; i < chunksWithEmbeddings.length; i += batchSize) {
    const batch = chunksWithEmbeddings.slice(i, i + batchSize);
    console.log(`  Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunksWithEmbeddings.length / batchSize)}...`);

    try {
      await insertDocumentChunks(batch);
    } catch (error) {
      console.error(`  ❌ Error inserting batch:`, error);
    }
  }

  console.log("🎉 Document processing complete!");
}

// Main execution
const pdfPath = process.argv[2] || path.join(process.cwd(), "documents", "Variation.pdf");

if (!fs.existsSync(pdfPath)) {
  console.error(`❌ PDF file not found at: ${pdfPath}`);
  console.log("Usage: npm run process-docs [path-to-pdf]");
  process.exit(1);
}

processPDF(pdfPath)
  .then(() => {
    console.log("✅ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
