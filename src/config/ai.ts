import { initializeAI } from '@/lib/ai';

export function setupAI(): void {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    console.info('Running in development mode without AI features');
    return;
  }

  try {
    initializeAI();
    console.info('AI initialized successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('AI initialization failed:', error.message);
    } else {
      console.error('AI initialization failed with unknown error');
    }
  }
}