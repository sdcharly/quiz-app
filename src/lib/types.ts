export interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuestionGenerationConfig {
  complexity: 'lite' | 'medium' | 'expert';
  count: number;
  content: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}