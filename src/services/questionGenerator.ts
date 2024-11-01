import OpenAI from 'openai';
import { QuestionGenerationConfig, GeneratedQuestion } from '../lib/types';
import { QuestionGenerationError, APIError, handleCommonErrors } from '../lib/errors';
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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryWithDelay(fn: () => Promise<any>, retries: number = MAX_RETRIES): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error instanceof APIError && error.statusCode === 429) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryWithDelay(fn, retries - 1);
    }
    throw error;
  }
}

function validateConfig(config: QuestionGenerationConfig): void {
  if (!config.content) {
    throw new QuestionGenerationError(
      'No document content found. Please upload and process a document first.'
    );
  }

  if (!config.count || config.count < 1) {
    throw new QuestionGenerationError(
      'Invalid question count. Please specify a positive number of questions to generate.'
    );
  }

  if (!config.complexity || !complexityGuides[config.complexity]) {
    throw new QuestionGenerationError(
      'Invalid complexity level. Please choose from: lite, medium, or expert.'
    );
  }
}

async function makeOpenAIRequest(openai: OpenAI, prompt: string): Promise<string> {
  try {
    const response = await retryWithDelay(() => 
      openai.chat.completions.create({
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
      })
    );

    const generatedContent = response.choices[0]?.message?.content;
    
    if (!generatedContent) {
      throw new APIError('No response received from AI service', 500);
    }

    return generatedContent;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    const processedError = handleCommonErrors(error);
    if (processedError.message.includes('Rate limit')) {
      throw new APIError('Rate limit exceeded. Please try again later.', 429);
    }
    if (processedError.message.includes('invalid_api_key')) {
      throw new APIError('Invalid API key. Please check your configuration.', 401);
    }
    
    throw new APIError(
      'Failed to generate questions. Please try again later.',
      500
    );
  }
}

export async function generateQuestions(
  config: QuestionGenerationConfig
): Promise<GeneratedQuestion[]> {
  const startTime = Date.now();
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  
  if (!apiKey) {
    throw new QuestionGenerationError(
      'AI API key not found. Please check your environment configuration.'
    );
  }

  try {
    validateConfig(config);

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

    const generatedContent = await makeOpenAIRequest(openai, prompt);
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
        const processedError = handleCommonErrors(error);
        errors.push(processedError.message);
      }
    }

    // Check if we got enough valid questions
    if (questions.length === 0) {
      throw new QuestionGenerationError(
        'Failed to parse any valid questions',
        { errors }
      );
    }

    if (questions.length < config.count) {
      console.warn(
        `Only generated ${questions.length} valid questions out of ${config.count} requested`
      );
    }

    // Add generation metadata
    const processedQuestions = questions.map(q => ({
      ...q,
      metadata: {
        generatedAt: new Date().toISOString(),
        complexity: config.complexity,
        generationTime: Date.now() - startTime
      }
    }));

    return processedQuestions;
  } catch (error) {
    if (error instanceof QuestionGenerationError || error instanceof APIError) {
      throw error;
    }
    
    const processedError = handleCommonErrors(error);
    throw new QuestionGenerationError(
      'Failed to generate questions',
      { errors: [processedError.message] }
    );
  }
}

export { QuestionGenerationError, APIError } from '../lib/errors';
