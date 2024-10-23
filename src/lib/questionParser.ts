import { sanitizeText } from './textUtils';
import { QuestionValidationError } from './errors';
import { GeneratedQuestion } from './types';

export function parseQuestionText(block: string): string {
  const patterns = [
    /Question:\s*(.+?)(?=Options:|A\)|A\.|\n|$)/is,
    /^\d+\.\s*(.+?)(?=Options:|A\)|A\.|\n|$)/is,
    /^(.+?)(?=Options:|A\)|A\.|\n|$)/is
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) {
      return sanitizeText(match[1]);
    }
  }

  throw new QuestionValidationError('Could not extract question text');
}

export function parseOptions(block: string): string[] {
  const patterns = [
    // Format: Options: A) ... B) ... C) ... D) ...
    /Options:\s*(?:A[).]\s*(.+?)\s*B[).]\s*(.+?)\s*C[).]\s*(.+?)\s*D[).]\s*(.+?))?(?=Correct|Explanation|$)/is,
    // Format: A) ... B) ... C) ... D) ...
    /A[).]\s*(.+?)\s*B[).]\s*(.+?)\s*C[).]\s*(.+?)\s*D[).]\s*(.+?)(?=Correct|Explanation|$)/is,
    // Individual option matches
    /(?:A[).]\s*(.+?)(?=B[).])|B[).]\s*(.+?)(?=C[).])|C[).]\s*(.+?)(?=D[).])|D[).]\s*(.+?)(?=Correct|Explanation|$))/g
  ];

  for (const pattern of patterns) {
    if (pattern.flags.includes('g')) {
      const options: string[] = [];
      let match;
      while ((match = pattern.exec(block)) !== null) {
        const option = match[1] || match[2] || match[3] || match[4];
        if (option) options.push(sanitizeText(option));
      }
      if (options.length === 4) return options;
    } else {
      const match = block.match(pattern);
      if (match) {
        const options = match.slice(1, 5).map(opt => sanitizeText(opt));
        if (options.every(Boolean)) return options;
      }
    }
  }

  throw new QuestionValidationError('Could not extract all 4 options');
}

export function parseCorrectAnswer(block: string): number {
  const patterns = [
    /Correct Answer:?\s*([0-3])/i,
    /Correct Answer:?\s*([A-D])/i,
    /Answer:?\s*([0-3])/i,
    /Answer:?\s*([A-D])/i
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) {
      if (/[0-3]/.test(match[1])) {
        return parseInt(match[1]);
      }
      return match[1].charCodeAt(0) - 65;
    }
  }

  throw new QuestionValidationError('Could not extract correct answer');
}

export function parseExplanation(block: string): string {
  const patterns = [
    /Explanation:?\s*(.+?)(?=(?:\n\s*(?:Question:|$)))/is,
    /Explanation:?\s*(.+?)$/is
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) {
      return sanitizeText(match[1]);
    }
  }

  throw new QuestionValidationError('Could not extract explanation');
}

export function parseQuestionBlock(block: string): GeneratedQuestion {
  const text = parseQuestionText(block);
  const options = parseOptions(block);
  const correctAnswer = parseCorrectAnswer(block);
  const explanation = parseExplanation(block);

  return {
    id: crypto.randomUUID(),
    text,
    options,
    correctAnswer,
    explanation
  };
}