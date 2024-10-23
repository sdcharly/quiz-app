import OpenAI from 'openai';
import { marked } from 'marked';

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
  } catch (error) {
    console.error('Failed to initialize AI client:', error);
    aiClient = null;
  }
}

export interface DocumentSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  wordCount: number;
  topicAreas: string[];
}

const SUMMARY_GENERATION_PROMPT = `
Analyze the following document and provide a comprehensive summary with these components:
1. A concise title that captures the main topic
2. A 2-3 paragraph summary of the key content
3. 3-5 key points or takeaways
4. Main topic areas covered

Format the response in JSON with the following structure:
{
  "title": "document title",
  "summary": "detailed summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "topicAreas": ["topic 1", "topic 2"]
}
`;

export async function generateDocumentSummary(content: string): Promise<DocumentSummary> {
  if (!aiClient) {
    throw new Error('AI client not initialized. Please check your API key configuration.');
  }

  try {
    const response = await aiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise summaries of documents.'
        },
        {
          role: 'user',
          content: `${SUMMARY_GENERATION_PROMPT}\n\nDocument content:\n${content.slice(0, 8000)}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      ...result,
      wordCount: content.split(/\s+/).length
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate document summary. Please try again.');
  }
}

export function formatMarkdown(text: string): string {
  return marked(text);
}