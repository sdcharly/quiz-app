import { create } from 'zustand';

interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

interface DocumentState {
  documents: Document[];
  fetchDocuments: () => Promise<void>;
  addDocument: (doc: Omit<Document, 'id' | 'createdAt'>) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  clearDocuments: () => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],

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
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
      }));
    } catch (error) {
      console.error('Failed to remove document:', error);
      throw error;
    }
  },

  clearDocuments: async () => {
    try {
      await fetch('/api/documents', {
        method: 'DELETE',
      });
      set({ documents: [] });
    } catch (error) {
      console.error('Failed to clear documents:', error);
      throw error;
    }
  },
}));