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