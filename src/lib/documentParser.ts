import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

// Configure PDF.js worker
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js';
const PDFJS_VERSION = '4.0.379';

GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/${PDFJS_VERSION}/pdf.worker.min.js`;

export interface ParseProgress {
  current: number;
  total: number;
  status: string;
}

export interface ParsedDocument {
  id: string;
  content: string;
  metadata: {
    title?: string;
    author?: string;
    pageCount?: number;
  };
}

async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF with PDF.js
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      onProgress?.({
        current: i,
        total: totalPages,
        status: `Processing page ${i} of ${totalPages}`,
      });

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    const cleanText = fullText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();

    if (!cleanText) {
      throw new Error('No readable text found in the PDF');
    }

    return {
      id: crypto.randomUUID(),
      content: cleanText,
      metadata: {
        pageCount: totalPages,
        title: file.name
      }
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to parse PDF file. Please ensure the file is not corrupted.'
    );
  }
}

async function extractTextFromTxt(file: File): Promise<ParsedDocument> {
  try {
    const content = await file.text();
    if (!content.trim()) {
      throw new Error('The text file appears to be empty');
    }
    return {
      id: crypto.randomUUID(),
      content: content.trim(),
      metadata: {
        title: file.name
      }
    };
  } catch (error) {
    console.error('Text file parsing error:', error);
    throw new Error(
      'Failed to read text file. Please ensure the file is properly encoded.'
    );
  }
}

export async function processDocument(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParsedDocument> {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    onProgress?.({
      current: 0,
      total: 100,
      status: 'Starting document processing...',
    });

    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file, onProgress);
    }
    
    if (file.type === 'text/plain') {
      onProgress?.({
        current: 50,
        total: 100,
        status: 'Processing text file...',
      });
      const result = await extractTextFromTxt(file);
      onProgress?.({
        current: 100,
        total: 100,
        status: 'Complete',
      });
      return result;
    }

    throw new Error(`Unsupported file type: ${file.type}. Please upload PDF or text files only.`);
  } catch (error) {
    console.error('Document processing error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while processing the document');
  }
}