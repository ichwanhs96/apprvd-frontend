import OpenAI from 'openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AISuggestion {
  id: string;
  type: 'compliance' | 'legal_risk' | 'data_protection' | 'regulatory' | 'clarity' | 'structure';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  position?: { start: number; end: number }; // Will be calculated in frontend using TinyMCE text content
  euRegulation?: string;
  recommendation?: string;
  highlightedText?: string; // Quoted text to find position in frontend
}

// Utility function to estimate token count (rough approximation)
function estimateTokenCount(text: string): number {
  // More conservative approximation: 1 token ≈ 3 characters for English text
  // This accounts for punctuation, spaces, and complex words
  return Math.ceil(text.length / 3);
}

// Utility function to truncate content to fit within token limits
function truncateContent(content: string, maxTokens: number = 5000): string {
  const estimatedTokens = estimateTokenCount(content);
  
  if (estimatedTokens <= maxTokens) {
    return content;
  }
  
  // Calculate how many characters we can keep (rough approximation)
  const maxChars = maxTokens * 3;
  
  // Try to truncate at a sentence boundary
  const truncated = content.substring(0, maxChars);
  const lastSentenceEnd = truncated.lastIndexOf('.');
  const lastParagraphEnd = truncated.lastIndexOf('\n\n');
  
  // Prefer paragraph breaks over sentence breaks
  if (lastParagraphEnd > maxChars * 0.8) {
    return content.substring(0, lastParagraphEnd) + '\n\n[Content truncated due to length]';
  } else if (lastSentenceEnd > maxChars * 0.8) {
    return content.substring(0, lastSentenceEnd + 1) + ' [Content truncated due to length]';
  } else {
    return truncated + ' [Content truncated due to length]';
  }
}

// Semantic text chunking using LangChain
async function chunkContentSemantic(content: string, maxChunkSize: number = 4000): Promise<Array<{ text: string; startPos: number; endPos: number }>> {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: maxChunkSize,
      chunkOverlap: 200, // Overlap to maintain context
      separators: [
        '\n\n', // Paragraphs
        '\n',   // Lines
        '. ',   // Sentences
        '! ',   // Exclamations
        '? ',   // Questions
        '; ',   // Semi-colons
        ', ',   // Commas
        ' ',    // Words
        ''      // Characters
      ],
    });

    const chunks = await textSplitter.splitText(content);
    
    // Filter out very small chunks and ensure they're within token limits
    const validChunks = chunks
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 50) // Minimum meaningful chunk size
      .filter(chunk => estimateTokenCount(chunk) <= maxChunkSize);

    console.log(`Semantic chunking: ${chunks.length} chunks created, ${validChunks.length} valid chunks`);
    
    // Now we need to find the actual positions of each chunk in the original content
    const chunksWithPositions: Array<{ text: string; startPos: number; endPos: number }> = [];
    
    for (const chunk of validChunks) {
      const startPos = content.indexOf(chunk);
      if (startPos !== -1) {
        chunksWithPositions.push({
          text: chunk,
          startPos: startPos,
          endPos: startPos + chunk.length
        });
        console.log(`Chunk position: ${startPos} to ${startPos + chunk.length}, length: ${chunk.length}`);
      } else {
        console.warn('Could not find chunk in original content:', chunk.substring(0, 100) + '...');
      }
    }
    
    return chunksWithPositions;
  } catch (error) {
    console.error('Error in semantic chunking:', error);
    // Fallback to simple chunking if semantic chunking fails
    return chunkContentSimple(content, maxChunkSize);
  }
}

// Fallback simple chunking function
function chunkContentSimple(content: string, maxChunkSize: number = 1000): Array<{ text: string; startPos: number; endPos: number }> {
  const chunks: Array<{ text: string; startPos: number; endPos: number }> = [];
  let currentChunk = '';
  let currentStartPos = 0;
  
  // Split by paragraphs first
  const paragraphs = content.split('\n\n');
  
  for (const paragraph of paragraphs) {
    const paragraphWithBreaks = paragraph + '\n\n';
    const estimatedTokens = estimateTokenCount(currentChunk + paragraphWithBreaks);
    
    if (estimatedTokens > maxChunkSize && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        startPos: currentStartPos,
        endPos: currentStartPos + currentChunk.trim().length
      });
      currentChunk = paragraphWithBreaks;
      currentStartPos = content.indexOf(currentChunk, currentStartPos);
    } else {
      currentChunk += paragraphWithBreaks;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      startPos: currentStartPos,
      endPos: currentStartPos + currentChunk.trim().length
    });
  }
  
  return chunks;
}

export async function summarizeDocument(content: string, documentName: string): Promise<string> {
  try {
    // Truncate content to fit within token limits
    const truncatedContent = truncateContent(content, 6000);
    
    const prompt = `Please provide a concise summary of the following document titled "${documentName}". 
    
    Focus on the main points, key insights, and overall purpose. Keep the summary clear and well-structured.
    
    ${truncatedContent.length < content.length ? 'Note: This document has been truncated due to length. Focus on summarizing the available content.' : ''}
    
    Document content:
    ${truncatedContent}
    
    Summary:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that creates clear, concise document summaries. Focus on the main points and key insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('OpenAI summarization error:', error);
    throw new Error('Failed to generate summary');
  }
}

export async function reviewDocument(content: string, documentName: string): Promise<AISuggestion[]> {
  try {
    // For review, we'll process the document in chunks if it's too long
    const estimatedTokens = estimateTokenCount(content);

    console.log("estimated token count ", estimatedTokens);
    
    if (estimatedTokens > 4000) {
      // Process in chunks for long documents
      return await reviewDocumentInChunks(content, documentName);
    } else {
      // Process normally for shorter documents
      return await reviewDocumentSingle(content, documentName);
    }
  } catch (error) {
    console.error('OpenAI review error:', error);
    throw new Error('Failed to review document');
  }
}

async function reviewDocumentSingle(content: string, documentName: string): Promise<AISuggestion[]> {
  const prompt = `Analyze this legal document for EU compliance issues. Keep responses brief and focused.

Focus: GDPR, regulatory gaps, legal risks, unclear terms, missing clauses.

For each issue provide:
- Type: compliance/legal_risk/data_protection/regulatory/clarity/structure
- Severity: low/medium/high/critical  
- EU regulation (if applicable)
- Complete text segment in quotes (use full sentences or complete phrases, do not truncate with "...")
- Brief recommendation

IMPORTANT: When quoting text, use complete sentences or phrases. Do not use "..." or truncate the quoted text. The quoted text must be exactly as it appears in the document.

Document: ${content}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an EU legal compliance expert. Provide brief, specific feedback with exact text references. When quoting text, always use complete sentences or phrases - never truncate with "...". The quoted text must match exactly what appears in the document.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 4192,
    temperature: 0.2,
  });

  const reviewText = response.choices[0]?.message?.content || '';
  return parseLegalReviewSuggestions(reviewText, content);
}

async function reviewDocumentInChunks(content: string, documentName: string): Promise<AISuggestion[]> {
  const chunks = await chunkContentSemantic(content, 4000);
  console.log("chunks ", chunks);
  console.log("chunks length ", chunks.length);
  const allSuggestions: AISuggestion[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkNumber = i + 1;
    const totalChunks = chunks.length;
    console.log("chunk estimated token length: ", chunk.text.length / 3);
    console.log("chunk position: ", chunk.startPos, "to", chunk.endPos);
    
    const prompt = `Review part ${chunkNumber}/${totalChunks} for EU compliance. Keep responses brief.

Focus: GDPR, regulatory gaps, legal risks, unclear terms, missing clauses.

For each issue provide:
- Type: compliance/legal_risk/data_protection/regulatory/clarity/structure
- Severity: low/medium/high/critical
- EU regulation (if applicable)
- Complete text segment in quotes (use full sentences or complete phrases, do not truncate with "...")
- Brief recommendation

IMPORTANT: When quoting text, use complete sentences or phrases. Do not use "..." or truncate the quoted text. The quoted text must be exactly as it appears in the document.

Content: ${chunk.text}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an EU legal compliance expert. Provide brief, specific feedback with exact text references. When quoting text, always use complete sentences or phrases - never truncate with "...". The quoted text must match exactly what appears in the document.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4192,
        temperature: 0.2,
      });

      const reviewText = response.choices[0]?.message?.content || '';
      const chunkSuggestions = parseLegalReviewSuggestions(reviewText, content);
      
      // Add section identifier to suggestions
      chunkSuggestions.forEach(suggestion => {
        suggestion.message = `[Section ${chunkNumber}]: ${suggestion.message}`;
      });
      
      allSuggestions.push(...chunkSuggestions);
    } catch (error) {
      console.error(`Error reviewing chunk ${chunkNumber}:`, error);
      // Continue with other chunks even if one fails
    }
  }
  
  // If no suggestions were generated, provide a general message
  if (allSuggestions.length === 0) {
    allSuggestions.push({
      id: 'general-suggestion',
      type: 'clarity',
      severity: 'low',
      message: 'Document review completed. This is a long document that was reviewed in sections. Please review the document for potential EU compliance issues.',
      recommendation: 'Consider having a qualified EU legal professional review the complete document.'
    });
  }
  
  return allSuggestions;
}

function parseLegalReviewSuggestions(reviewText: string, content: string): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  
  // Enhanced parsing for legal review suggestions
  const lines = reviewText.split('\n').filter(line => line.trim());
  
  let currentSuggestion: Partial<AISuggestion> = {};
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect suggestion type
    if (lowerLine.includes('compliance') || lowerLine.includes('gdpr') || lowerLine.includes('regulation')) {
      if (currentSuggestion.message) {
        suggestions.push(createCompleteSuggestion(currentSuggestion, content));
      }
      currentSuggestion = {
        type: 'compliance',
        severity: 'medium'
      };
      currentSuggestion.message = line.replace(/^.*?:/, '').trim();
    } else if (lowerLine.includes('legal risk') || lowerLine.includes('litigation') || lowerLine.includes('penalty')) {
      if (currentSuggestion.message) {
        suggestions.push(createCompleteSuggestion(currentSuggestion, content));
      }
      currentSuggestion = {
        type: 'legal_risk',
        severity: 'high'
      };
      currentSuggestion.message = line.replace(/^.*?:/, '').trim();
    } else if (lowerLine.includes('data protection') || lowerLine.includes('personal data') || lowerLine.includes('consent')) {
      if (currentSuggestion.message) {
        suggestions.push(createCompleteSuggestion(currentSuggestion, content));
      }
      currentSuggestion = {
        type: 'data_protection',
        severity: 'high'
      };
      currentSuggestion.message = line.replace(/^.*?:/, '').trim();
    } else if (lowerLine.includes('regulatory') || lowerLine.includes('licensing') || lowerLine.includes('reporting')) {
      if (currentSuggestion.message) {
        suggestions.push(createCompleteSuggestion(currentSuggestion, content));
      }
      currentSuggestion = {
        type: 'regulatory',
        severity: 'medium'
      };
      currentSuggestion.message = line.replace(/^.*?:/, '').trim();
    } else if (lowerLine.includes('clarity') || lowerLine.includes('ambiguous') || lowerLine.includes('unclear')) {
      if (currentSuggestion.message) {
        suggestions.push(createCompleteSuggestion(currentSuggestion, content));
      }
      currentSuggestion = {
        type: 'clarity',
        severity: 'low'
      };
      currentSuggestion.message = line.replace(/^.*?:/, '').trim();
    } else if (lowerLine.includes('structure') || lowerLine.includes('formatting') || lowerLine.includes('missing')) {
      if (currentSuggestion.message) {
        suggestions.push(createCompleteSuggestion(currentSuggestion, content));
      }
      currentSuggestion = {
        type: 'structure',
        severity: 'low'
      };
      currentSuggestion.message = line.replace(/^.*?:/, '').trim();
    } else {
      // Continue building current message
      if (currentSuggestion.message) {
        currentSuggestion.message += ' ' + line.trim();
      } else {
        currentSuggestion.message = line.trim();
      }
    }
  }
  
  // Add the last suggestion
  if (currentSuggestion.message) {
    suggestions.push(createCompleteSuggestion(currentSuggestion, content));
  }
  
  // If parsing didn't work well, create a general suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'general-suggestion',
      type: 'clarity',
      severity: 'low',
      message: reviewText.trim() || 'EU legal review completed. Please review the document for potential compliance issues.',
      recommendation: 'Consider having a qualified EU legal professional review the document.'
    });
  }
  
  return suggestions;
}

function createCompleteSuggestion(partial: Partial<AISuggestion>, content: string): AISuggestion {
  const id = `suggestion-${Math.random().toString(36).substring(2, 15)}`;
  
  // Extract quoted text for frontend position calculation
  let highlightedText: string | undefined;
  
  if (partial.message) {
    // Look for quoted text in the message
    const quotedMatch = partial.message.match(/"([^"]+)"/);
    if (quotedMatch) {
      highlightedText = quotedMatch[1];
      
      // Check if the quoted text contains truncation indicators
      if (highlightedText.includes('...') || highlightedText.includes('…')) {
        console.warn('Detected truncated text in AI suggestion:', highlightedText);
        console.warn('This may cause positioning issues. Consider regenerating the review.');
        
        // Try to find a better match by looking for the text before the truncation
        const beforeTruncation = highlightedText.split(/\.{3,}|…/)[0];
        if (beforeTruncation && beforeTruncation.length > 10) {
          console.log('Attempting to use text before truncation:', beforeTruncation);
          highlightedText = beforeTruncation.trim();
        }
      }
      
      console.log('Found quoted text for frontend position calculation:', highlightedText);
    }
  }
  
  return {
    id,
    type: partial.type || 'clarity',
    severity: partial.severity || 'medium',
    message: partial.message || '',
    highlightedText,
    euRegulation: partial.euRegulation,
    recommendation: partial.recommendation
  };
} 