import { create } from 'zustand';
import { addDocumentToStore, searchSimilarChunks } from '@/lib/vectorDb';
import { Document as LangchainDoc } from 'langchain/document';

interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  chunks: string[];
  metadata: {
    fileType: string;
    fileSize: number;
    pageCount?: number;
    wordCount: number;
    chunkCount: number;
    processingTime: number;
    language?: string;
  };
  createdAt: string;
}

interface DocumentState {
  documents: Document[];
  selectedDocuments: string[];
  fetchDocuments: () => Promise<void>;
  addDocument: (doc: Omit<Document, 'id' | 'createdAt'>) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  clearDocuments: () => Promise<void>;
  selectDocument: (id: string) => void;
  deselectDocument: (id: string) => void;
  clearSelectedDocuments: () => void;
  searchDocuments: (query: string) => Promise<LangchainDoc[]>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  selectedDocuments: [],

  fetchDocuments: async () => {
    try {
      const response = await fetch('/api/documents');
      const documents = await response.json();
      set({ documents });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  },

  addDocument: async (doc) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doc),
      });

      const newDoc = await response.json();
      
      // Add document chunks to vector store
      await addDocumentToStore(new LangchainDoc({
        pageContent: doc.content,
        metadata: {
          title: doc.title,
          type: doc.type,
          ...doc.metadata,
        },
      }));

      set((state) => ({
        documents: [...state.documents, newDoc],
      }));
    } catch (error) {
      console.error('Failed to add document:', error);
      throw error;
    }
  },

  removeDocument: async (id) => {
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        selectedDocuments: state.selectedDocuments.filter((docId) => docId !== id),
      }));
    } catch (error) {
      console.error('Failed to remove document:', error);
      throw error;
    }
  },

  clearDocuments: async () => {
    try {
      await fetch('/api/documents', { method: 'DELETE' });
      set({ documents: [], selectedDocuments: [] });
    } catch (error) {
      console.error('Failed to clear documents:', error);
      throw error;
    }
  },

  selectDocument: (id) => {
    set((state) => ({
      selectedDocuments: [...state.selectedDocuments, id],
    }));
  },

  deselectDocument: (id) => {
    set((state) => ({
      selectedDocuments: state.selectedDocuments.filter((docId) => docId !== id),
    }));
  },

  clearSelectedDocuments: () => {
    set({ selectedDocuments: [] });
  },

  searchDocuments: async (query) => {
    try {
      const results = await searchSimilarChunks(query);
      return results;
    } catch (error) {
      console.error('Failed to search documents:', error);
      return [];
    }
  },
}));