import OpenAI from 'openai';
import { QuestionGenerationConfig, GeneratedQuestion } from '../lib/types';
import { QuestionGenerationError } from '../lib/errors';
import { parseQuestionBlock } from '../lib/questionParser';
import { splitIntoBlocks } from '../lib/textUtils';
import { validateQuestionOrThrow } from '../lib/validation';

const complexityGuides = {
  lite: `
    - Focus on basic comprehension and recall
    - Use straightforward language
    - Test fundamental concepts
    - Make options clearly distinct
    - Include simple explanations
  `,
  medium: `
    - Test understanding and application
    - Include some analytical thinking
    - Use moderate technical language
    - Require connecting multiple concepts
    - Provide detailed explanations
  `,
  expert: `
    - Focus on advanced analysis and synthesis
    - Use complex scenarios and edge cases
    - Include technical terminology
    - Require deep understanding
    - Test problem-solving abilities
    - Provide comprehensive explanations
  `
};

export async function generateQuestions(
  config: QuestionGenerationConfig
): Promise<GeneratedQuestion[]> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  
  if (!apiKey) {
    throw new QuestionGenerationError(
      'AI API key not found. Please check your environment configuration.'
    );
  }

  if (!config.content) {
    throw new QuestionGenerationError(
      'No document content found. Please upload and process a document first.'
    );
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  const prompt = `
    Generate ${config.count} multiple-choice questions based on this content at ${config.complexity.toUpperCase()} complexity level.

    Guidelines:
    ${complexityGuides[config.complexity]}

    Format EACH question EXACTLY like this:

    Question: [Question text]
    A) [First option]
    B) [Second option]
    C) [Third option]
    D) [Fourth option]
    Correct Answer: [0 for A, 1 for B, 2 for C, or 3 for D]
    Explanation: [Detailed explanation]

    Requirements:
    - Each question must test understanding, not just recall
    - All options must be plausible but only one correct
    - Include a clear, detailed explanation
    - Make sure options are distinct and unambiguous
    - Ensure correct answer is clearly indicated
    - Write complete, grammatically correct sentences

    Content:
    ${config.content.slice(0, 8000)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: "You are an expert quiz generator that creates high-quality, relevant multiple-choice questions based on document content."
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

export { QuestionGenerationError } from '../lib/errors';