import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { DocumentProcessingError, FileValidationError, handleCommonErrors } from './errors';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

export interface ProcessedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    title?: string;
    fileSize?: number;
    fileType?: string;
    processingTime?: number;
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = ['application/pdf', 'text/plain'];

function validateFile(file: File): void {
  if (!file) {
    throw new FileValidationError('No file provided');
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new FileValidationError(
      `Unsupported file type: ${file.type}. Please upload PDF or text files only.`,
      file.name
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError(
      `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      file.name
    );
  }
}

async function extractTextFromPDF(file: File): Promise<ProcessedDocument> {
  const startTime = Date.now();
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    let totalCharacters = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      totalCharacters += pageText.length;
      fullText += pageText + '\n\n';

      // Check for potentially corrupted or unreadable content
      if (pageText.length === 0) {
        console.warn(`Page ${i} appears to be empty or unreadable`);
      }
    }

    const cleanText = fullText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();

    if (!cleanText) {
      throw new DocumentProcessingError(
        'No readable text found in the PDF. The file might be scanned or protected.',
        'PDF'
      );
    }

    if (totalCharacters === 0) {
      throw new DocumentProcessingError(
        'The PDF appears to be empty or contains no extractable text',
        'PDF'
      );
    }

    return {
      content: cleanText,
      metadata: {
        pageCount: pdf.numPages,
        title: file.name,
        fileSize: file.size,
        fileType: file.type,
        processingTime: Date.now() - startTime
      }
    };
  } catch (error) {
    const processedError = handleCommonErrors(error);
    
    if (processedError.message.includes('Invalid PDF structure')) {
      throw new DocumentProcessingError('The PDF file appears to be corrupted', 'PDF');
    }
    
    throw new DocumentProcessingError(
      processedError.message,
      'PDF'
    );
  }
}

async function extractTextFromTxt(file: File): Promise<ProcessedDocument> {
  const startTime = Date.now();
  
  try {
    const content = await file.text();
    const cleanContent = content.trim();
    
    if (!cleanContent) {
      throw new DocumentProcessingError(
        'The text file appears to be empty',
        'TXT'
      );
    }

    // Check for potential encoding issues
    if (cleanContent.includes('�')) {
      console.warn('Text file may have encoding issues');
    }
    
    return {
      content: cleanContent,
      metadata: {
        title: file.name,
        fileSize: file.size,
        fileType: file.type,
        processingTime: Date.now() - startTime
      }
    };
  } catch (error) {
    const processedError = handleCommonErrors(error);
    throw new DocumentProcessingError(
      `Failed to read text file: ${processedError.message}`,
      'TXT'
    );
  }
}

export async function processDocument(file: File): Promise<ProcessedDocument> {
  try {
    validateFile(file);

    const result = await (file.type === 'application/pdf' 
      ? extractTextFromPDF(file)
      : extractTextFromTxt(file));

    // Validate processed content
    if (result.content.length < 50) {
      console.warn('Processed document contains very little text');
    }

    return result;
  } catch (error) {
    if (error instanceof DocumentProcessingError || 
        error instanceof FileValidationError) {
      throw error;
    }
    
    throw new DocumentProcessingError(
      'An unexpected error occurred while processing the document',
      file.type
    );
  }
}
