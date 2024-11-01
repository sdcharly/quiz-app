export class QuestionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuestionValidationError';
  }
}

export class QuestionGenerationError extends Error {
  constructor(message: string, public details?: { errors: string[] }) {
    super(message);
    this.name = 'QuestionGenerationError';
  }
}

export class DocumentProcessingError extends Error {
  constructor(message: string, public fileType?: string) {
    super(message);
    this.name = 'DocumentProcessingError';
  }
}

export class APIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export class FileValidationError extends Error {
  constructor(message: string, public fileName?: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

// Helper function to convert technical errors to user-friendly messages
export function getUserFriendlyError(error: Error): string {
  switch (error.constructor) {
    case QuestionValidationError:
      return `Invalid question format: ${error.message}`;
    
    case QuestionGenerationError:
      const genError = error as QuestionGenerationError;
      if (genError.details?.errors) {
        return `Failed to generate questions: ${genError.details.errors.join('. ')}`;
      }
      return `Failed to generate questions: ${error.message}`;
    
    case DocumentProcessingError:
      const docError = error as DocumentProcessingError;
      if (docError.fileType) {
        return `Failed to process ${docError.fileType} document: ${error.message}`;
      }
      return `Failed to process document: ${error.message}`;
    
    case APIError:
      const apiError = error as APIError;
      if (apiError.statusCode) {
        return `Server error (${apiError.statusCode}): ${error.message}`;
      }
      return `Server error: ${error.message}`;
    
    case FileValidationError:
      const fileError = error as FileValidationError;
      if (fileError.fileName) {
        return `Invalid file "${fileError.fileName}": ${error.message}`;
      }
      return `Invalid file: ${error.message}`;
    
    default:
      return error.message || 'An unexpected error occurred';
  }
}

// Helper function to determine if an error is retryable
export function isRetryableError(error: Error): boolean {
  return error instanceof APIError && 
    (error.statusCode === 429 || // Rate limit
     error.statusCode === 503 || // Service unavailable
     error.statusCode === 504);  // Gateway timeout
}

// Helper function to handle common error scenarios
export function handleCommonErrors(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  
  return new Error('An unexpected error occurred');
}
