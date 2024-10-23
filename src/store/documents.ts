import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProcessedDocument {
  id: string;
  name: string;
  content: string;
  type: string;
  metadata?: {
    title?: string;
    author?: string;
    pageCount?: number;
  };
  createdAt: string;
}

interface DocumentState {
  documents: ProcessedDocument[];
  addDocument: (doc: ProcessedDocument) => void;
  removeDocument: (id: string) => void;
  clearDocuments: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      documents: [],
      addDocument: (doc) =>
        set((state) => ({
          documents: [...state.documents, doc],
        })),
      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        })),
      clearDocuments: () => set({ documents: [] }),
    }),
    {
      name: 'document-storage',
    }
  )
);