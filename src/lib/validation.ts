import { GeneratedQuestion, ValidationResult } from './types';
import { QuestionValidationError } from './errors';

export function validateQuestion(question: GeneratedQuestion): ValidationResult {
  const errors: string[] = [];

  // Validate question text
  if (!question.text || question.text.length < 10) {
    errors.push('Question text must be at least 10 characters long');
  }

  // Validate options
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    errors.push('Question must have exactly 4 options');
  } else {
    // Check each option
    question.options.forEach((option, index) => {
      if (!option || option.length < 1) {
        errors.push(`Option ${index + 1} cannot be empty`);
      }
    });

    // Check for duplicate options
    const uniqueOptions = new Set(question.options);
    if (uniqueOptions.size !== question.options.length) {
      errors.push('All options must be unique');
    }
  }

  // Validate correct answer
  if (typeof question.correctAnswer !== 'number' || 
      question.correctAnswer < 0 || 
      question.correctAnswer > 3) {
    errors.push('Correct answer must be a number between 0 and 3');
  }

  // Validate explanation
  if (!question.explanation || question.explanation.length < 10) {
    errors.push('Explanation must be at least 10 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateQuestionOrThrow(question: GeneratedQuestion): void {
  const { isValid, errors } = validateQuestion(question);
  if (!isValid) {
    throw new QuestionValidationError(errors.join('; '));
  }
}