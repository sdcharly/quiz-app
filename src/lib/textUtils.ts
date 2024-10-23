export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    // Normalize quotes and apostrophes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim()
    // Remove any control characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Replace multiple periods with single
    .replace(/\.{2,}/g, '.')
    // Ensure proper spacing after punctuation
    .replace(/([.,!?])(?=[A-Za-z])/g, '$1 ')
    // Remove any HTML tags
    .replace(/<[^>]*>/g, '')
    // Normalize dashes
    .replace(/[\u2013\u2014]/g, '-');
}

export function splitIntoBlocks(text: string): string[] {
  return text
    .split(/(?=(?:\d+\.|Question:))/i)
    .map(block => block.trim())
    .filter(block => block.length > 0);
}