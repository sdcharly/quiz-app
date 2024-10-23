import { getAIClient } from './config';
import { SUMMARY_PROMPT } from './prompts';

export interface DocumentSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  wordCount: number;
  topicAreas: string[];
}

export async function generateDocumentSummary(content: string): Promise<DocumentSummary> {
  const openai = getAIClient();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise summaries of documents.'
        },
        {
          role: 'user',
          content: `${SUMMARY_PROMPT}\n\nDocument content:\n${content.slice(0, 8000)}`
        }
      ],
      temperature: 0.3
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