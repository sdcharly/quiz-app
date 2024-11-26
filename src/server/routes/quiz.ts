import { Router } from 'express';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { searchSimilarChunks } from '../../lib/vectorDb';
import { validateRequest } from '../middleware/validate';
import { Redis } from 'ioredis';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Zod schemas for type safety
const generateQuestionsSchema = z.object({
  documentIds: z.array(z.string()),
  count: z.number().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  topics: z.array(z.string()).optional(),
});

// Types for our application
interface QuestionMetadata {
  difficulty: string;
  topics: string[];
  sourceDocumentId: string;
  chunkIndex: number;
}

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  metadata: QuestionMetadata;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to select relevant chunks
async function selectRelevantChunks(documentIds: string[], count: number): Promise<string[]> {
  try {
    const relevantChunks = await Promise.all(
      documentIds.map(async (docId: string) => {
        const cacheKey = `chunks:${docId}`;
        const cachedChunks = await redis.get(cacheKey);
        
        if (cachedChunks) {
          return JSON.parse(cachedChunks);
        }

        const chunks = await searchSimilarChunks('', 100);
        const filteredChunks = chunks
          .filter(chunk => chunk.metadata?.documentId === docId)
          .map(chunk => chunk.pageContent);

        // Cache for 1 hour
        await redis.setex(cacheKey, 3600, JSON.stringify(filteredChunks));
        return filteredChunks;
      })
    );

    // Intelligent chunk selection - ensure even distribution
    const allChunks = relevantChunks.flat();
    const chunkSize = Math.ceil(allChunks.length / count);
    const selectedChunks: string[] = [];
    
    for (let i = 0; i < count && i * chunkSize < allChunks.length; i++) {
      const startIdx = i * chunkSize;
      const chunk = allChunks[startIdx];
      selectedChunks.push(chunk);
    }

    return selectedChunks;
  } catch (error) {
    console.error('Error selecting chunks:', error);
    throw new Error('Failed to select relevant content chunks');
  }
}

// Helper function to validate generated questions
function validateGeneratedQuestions(questions: Question[]): boolean {
  return questions.every(q => {
    return (
      q.text.length >= 10 &&
      q.options.length === 4 &&
      q.options.every(opt => opt.length > 0) &&
      q.correctAnswer >= 0 &&
      q.correctAnswer <= 3 &&
      q.explanation.length >= 20
    );
  });
}

router.post('/generate', 
  limiter,
  validateRequest(generateQuestionsSchema), 
  async (req, res) => {
    try {
      const { documentIds, count, difficulty = 'medium', topics = [] } = req.body;

      // Check cache first
      const cacheKey = `questions:${documentIds.join(':')}:${count}:${difficulty}:${topics.join(':')}`;
      const cachedQuestions = await redis.get(cacheKey);
      
      if (cachedQuestions) {
        return res.json(JSON.parse(cachedQuestions));
      }

      const selectedChunks = await selectRelevantChunks(documentIds, count);

      const systemPrompt = `You are an expert educational content creator specializing in creating high-quality multiple-choice questions.
Follow these guidelines strictly:
- Create questions that test understanding, not just memorization
- Ensure all options are plausible but only one is clearly correct
- Make distractors (wrong options) realistic and educational
- Write clear, unambiguous questions
- Include detailed explanations that teach the concept
- Maintain consistent difficulty level: ${difficulty}
- Focus on these topics: ${topics.join(', ')}`;

      const userPrompt = `Generate ${count} multiple-choice questions based on the following content.
Each question must follow this format exactly:
{
  "text": "question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0,
  "explanation": "detailed explanation",
  "metadata": {
    "difficulty": "${difficulty}",
    "topics": ${JSON.stringify(topics)},
    "sourceDocumentId": "document_id",
    "chunkIndex": 0
  }
}

Content to base questions on:
${selectedChunks.join('\n\n')}

Return an array of question objects.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const response = completion.choices[0].message.content;
      const questions: Question[] = JSON.parse(response || '[]');

      // Validate generated questions
      if (!validateGeneratedQuestions(questions)) {
        throw new Error('Generated questions did not meet quality standards');
      }

      // Cache the results for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(questions));

      res.json(questions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      
      // Detailed error responses
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request parameters',
          details: error.errors 
        });
      }
      
      if (error instanceof SyntaxError) {
        return res.status(500).json({ 
          error: 'Failed to parse generated questions',
          message: 'The AI generated invalid JSON' 
        });
      }

      res.status(500).json({ 
        error: 'Failed to generate questions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
});

export default router;
