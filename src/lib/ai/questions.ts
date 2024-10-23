import { getAIClient } from './config';
import { QUESTION_GENERATION_SYSTEM_PROMPT, complexityGuides } from './prompts';
import { QuestionGenerationError } from '../errors';
import { parseQuestionBlock } from '../questionParser';
import { splitIntoBlocks } from '../textUtils';
import { validateQuestionOrThrow } from '../validation';
import type { GeneratedQuestion, QuestionGenerationConfig } from '../types';

export async function generateQuestions(
  config: QuestionGenerationConfig
): Promise<GeneratedQuestion[]> {
  const openai = getAIClient();

  const prompt = `
    Generate ${config.count} multiple-choice questions based on this content at ${config.complexity.toUpperCase()} complexity level.

    Guidelines:
    ${complexityGuides[config.complexity]}

    Content:
    ${config.content.slice(0, 8000)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: QUESTION_GENERATION_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096
    });

    const generatedContent = response.choices[0]?.message?.content;
    
    if (!generatedContent) {
      throw new QuestionGenerationError('No response received from AI service');
    }

    const questionBlocks = splitIntoBlocks(generatedContent);

    if (questionBlocks.length === 0) {
      throw new QuestionGenerationError('No question blocks found in AI response');
    }

    const questions: GeneratedQuestion[] = [];
    const errors: string[] = [];

    for (const block of questionBlocks) {
      try {
        const question = parseQuestionBlock(block);
        validateQuestionOrThrow(question);
        questions.push(question);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error.message);
        }
      }
    }

    if (questions.length === 0) {
      throw new QuestionGenerationError(
        'Failed to parse any valid questions',
        { errors }
      );
    }

    return questions;
  } catch (error) {
    if (error instanceof QuestionGenerationError) {
      throw error;
    }
    
    throw new QuestionGenerationError(
      'An unexpected error occurred while generating questions',
      { errors: [(error as Error).message] }
    );
  }
}