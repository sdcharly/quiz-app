import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

export interface ProcessedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    title?: string;
  };
}

async function extractTextFromPDF(file: File): Promise<ProcessedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
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
      content: cleanText,
      metadata: {
        pageCount: pdf.numPages,
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

async function extractTextFromTxt(file: File): Promise<ProcessedDocument> {
  try {
    const content = await file.text();
    const cleanContent = content.trim();
    
    if (!cleanContent) {
      throw new Error('The text file appears to be empty');
    }
    
    return {
      content: cleanContent,
      metadata: {
        title: file.name
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