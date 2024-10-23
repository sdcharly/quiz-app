export const SUMMARY_PROMPT = `
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

export const QUESTION_GENERATION_SYSTEM_PROMPT = `
You are an expert quiz generator that creates high-quality, relevant multiple-choice questions based on document content.

Each question MUST follow this EXACT format:

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
`;

export const complexityGuides = {
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