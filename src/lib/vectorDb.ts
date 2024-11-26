import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "langchain/document";

let vectorStore: HNSWLib | null = null;

export async function initializeVectorStore() {
  if (!vectorStore) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: import.meta.env.VITE_AI_API_KEY,
    });
    vectorStore = new HNSWLib(embeddings, {
      space: "cosine",
      numDimensions: 1536, // OpenAI embeddings dimensions
    });
  }
  return vectorStore;
}

export async function addDocumentToStore(document: Document) {
  const store = await initializeVectorStore();
  await store.addDocuments([document]);
  return store;
}

export async function searchSimilarChunks(query: string, k: number = 5) {
  const store = await initializeVectorStore();
  const results = await store.similaritySearch(query, k);
  return results;
}

// Save the vector store to disk (optional)
export async function saveVectorStore(directory: string) {
  const store = await initializeVectorStore();
  await store.save(directory);
}

// Load the vector store from disk (optional)
export async function loadVectorStore(directory: string) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: import.meta.env.VITE_AI_API_KEY,
  });
  vectorStore = await HNSWLib.load(directory, embeddings);
  return vectorStore;
}
