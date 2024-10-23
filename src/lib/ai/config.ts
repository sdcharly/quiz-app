import OpenAI from 'openai';

let aiClient: OpenAI | null = null;

export function initializeAI(): void {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    console.warn('OpenAI API key not configured');
    return;
  }

  try {
    aiClient = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true
    });
    console.info('OpenAI client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    aiClient = null;
  }
}

export function getAIClient(): OpenAI {
  if (!aiClient) {
    throw new Error('OpenAI client not initialized. Please check your API key configuration.');
  }
  return aiClient;
}