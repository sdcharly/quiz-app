import { GlobalWorkerOptions } from 'pdfjs-dist';
import { RecursiveCharacterTextSplitter, TokenTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"; 
import { Document } from "langchain/document";

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

export interface DocumentMetadata {
  title: string;
  fileType: string;
  fileSize: number;
  pageCount?: number;
  wordCount: number;
  averageWordsPerChunk: number;
  chunkCount: number;
  splitterType: string;
  splitterConfig: {
    strategy: 'fixed' | 'semantic' | 'overlap';
    chunkSize: number;
    overlap?: number;
  };
  chunkSize: number;
  overlap?: number;
  processingTime: number;
  language?: string;
  createdAt: string;
}

export interface ProcessedDocument {
  content: string;
  chunks: string[];
  metadata: DocumentMetadata;
}

interface TextStats {
  wordCount: number;
  avgSentenceLength: number;
  complexity: number;
}

function analyzeText(text: string): TextStats {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.length > 0);
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  
  // Simple complexity score based on average word length and sentence length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const complexity = (avgWordLength * 0.5) + (avgSentenceLength * 0.5);

  return {
    wordCount: words.length,
    avgSentenceLength,
    complexity
  };
}

function selectBestSplitter(stats: TextStats): DocumentMetadata['splitterConfig'] {
  // Choose splitter strategy based on text characteristics
  if (stats.complexity > 15) {
    // For complex text, use semantic splitting with overlap
    return {
      strategy: 'semantic',
      chunkSize: 1000,
      overlap: 100
    };
  } else if (stats.avgSentenceLength > 20) {
    // For long sentences, use overlapping chunks
    return {
      strategy: 'overlap',
      chunkSize: 1500,
      overlap: 200
    };
  } else {
    // For simple text, use fixed-size chunks
    return {
      strategy: 'fixed',
      chunkSize: 2000
    };
  }
}

async function splitText(text: string, config: DocumentMetadata['splitterConfig']): Promise<string[]> {
  let splitter;
  
  switch (config.strategy) {
    case 'semantic':
      // Use token-based splitting for more semantic chunks
      splitter = new TokenTextSplitter({
        chunkSize: config.chunkSize,
        chunkOverlap: config.overlap || 0,
      });
      break;
      
    case 'overlap':
      // Use recursive splitter with overlap
      splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.chunkSize,
        chunkOverlap: config.overlap || 0,
      });
      break;
      
    default:
      // Use recursive splitter for fixed size
      splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.chunkSize,
        chunkOverlap: 0,
      });
  }
  
  const docs = await splitter.createDocuments([text]);
  return docs.map(doc => doc.pageContent);
}

async function extractTextFromPDF(file: File): Promise<ProcessedDocument> {
  const startTime = Date.now();
  
  try {
    // Convert File to Blob for PDFLoader
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer]);
    const loader = new PDFLoader(blob);
    
    const docs = await loader.load();
    const cleanText = docs.map((doc: Document) => doc.pageContent).join('\n');
    
    if (!cleanText) {
      throw new Error('No readable text found in the PDF');
    }

    const stats = analyzeText(cleanText);
    const splitterConfig = selectBestSplitter(stats);
    const chunks = await splitText(cleanText, splitterConfig);

    return {
      content: cleanText,
      chunks,
      metadata: {
        title: file.name,
        fileType: file.type,
        fileSize: file.size,
        pageCount: docs.length,
        wordCount: stats.wordCount,
        averageWordsPerChunk: stats.wordCount / chunks.length,
        chunkCount: chunks.length,
        splitterType: splitterConfig.strategy,
        splitterConfig,
        chunkSize: splitterConfig.chunkSize,
        overlap: splitterConfig.overlap,
        processingTime: Date.now() - startTime,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}

async function extractTextFromTxt(file: File): Promise<ProcessedDocument> {
  const startTime = Date.now();
  
  try {
    const content = await file.text();
    const cleanContent = content.trim();
    
    if (!cleanContent) {
      throw new Error('The text file appears to be empty');
    }
    
    const stats = analyzeText(cleanContent);
    const splitterConfig = selectBestSplitter(stats);
    const chunks = await splitText(cleanContent, splitterConfig);
    
    return {
      content: cleanContent,
      chunks,
      metadata: {
        title: file.name,
        fileType: file.type,
        fileSize: file.size,
        wordCount: stats.wordCount,
        averageWordsPerChunk: stats.wordCount / chunks.length,
        chunkCount: chunks.length,
        splitterType: splitterConfig.strategy,
        splitterConfig,
        chunkSize: splitterConfig.chunkSize,
        overlap: splitterConfig.overlap,
        processingTime: Date.now() - startTime,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Text file parsing error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to read text file. Please ensure the file is properly encoded.'
    );
  }
}

export async function processDocument(file: File): Promise<ProcessedDocument> {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    }
    
    if (file.type === 'text/plain') {
      return await extractTextFromTxt(file);
    }

    throw new Error(`Unsupported file type: ${file.type}. Please upload PDF or text files only.`);
  } catch (error) {
    console.error('Document processing error:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while processing the document');
  }
}