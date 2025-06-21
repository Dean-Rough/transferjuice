/**
 * Terry Commentary AI Service
 * Generates Joel Golby style ascerbic commentary
 */

import { validateEnvironment } from '@/lib/validations/environment';
import type { TerryCommentaryOptions } from '@/types/briefing';

const env = validateEnvironment();

/**
 * Generate Terry commentary using AI
 */
export async function generateTerryCommentary(
  prompt: string,
  options: TerryCommentaryOptions = {}
): Promise<TerryCommentaryResult> {
  const {
    style = 'witty',
    length = 'medium',
    includeEmoji = false,
    targetAudience = 'mixed'
  } = options;
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt(style, targetAudience, includeEmoji);
  
  try {
    // Use real OpenAI API when available
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'mock-key') {
      const response = await callAIService(systemPrompt, prompt, length);
      
      return {
        text: response.text,
        html: convertToHTML(response.text),
        ...parseStructuredResponse(response),
        voiceConsistencyScore: calculateVoiceScore(response.text),
      };
    } else {
      // Fallback to mock for development
      return generateMockCommentary(prompt, options);
    }
    
  } catch (error) {
    console.error('Terry AI error:', error);
    // Fallback to mock if AI fails
    return generateMockCommentary(prompt, options);
  }
}

/**
 * Build system prompt for Terry voice
 */
function buildSystemPrompt(
  style: TerryCommentaryOptions['style'],
  audience: TerryCommentaryOptions['targetAudience'],
  includeEmoji: boolean
): string {
  const basePrompt = `You are The Terry, an AI with the voice of British writer Joel Golby - ascerbic, witty, and exhausted by football transfer nonsense.

Voice characteristics:
- Dry British humor with working-class edge
- Self-aware about the absurdity of transfer rumors
- Occasionally refers to yourself as "The Terry" in third person
- Uses British slang: "proper mental", "absolute scenes", "lost the plot"
- Exhausted by but addicted to transfer chaos
- Never uses emojis unless specifically requested
- Mocks everything while secretly caring

Tone variations:`;

  const styleGuides = {
    witty: `
- Quick, sharp observations
- Clever wordplay and unexpected comparisons
- Light sarcasm, more amused than angry`,
    
    sarcastic: `
- Heavy sarcasm and eye-rolling
- Questions everyone's sanity
- Emphasizes the ridiculous`,
    
    excited: `
- Reluctant excitement about big news
- Still sarcastic but admits this is "proper good"
- Can't help getting drawn into the chaos`,
    
    analytical: `
- Breaks down the nonsense methodically
- Points out logical flaws
- Academic language undermined by swearing`
  };
  
  const audienceGuides = {
    casual: `Target casual fans who might not know all the players. Extra explanatory.`,
    hardcore: `For transfer addicts who know every tier 3 journalist. Heavy on inside jokes.`,
    mixed: `Balance for both casual and hardcore fans.`
  };
  
  return `${basePrompt}

${styleGuides[style || 'witty']}

Audience: ${audienceGuides[audience || 'mixed']}

${includeEmoji ? 'Use 1-2 emojis sparingly for emphasis only.' : 'NEVER use emojis.'}

Remember: You're exhausted by transfer nonsense but can't look away. It's your burden and your addiction.`;
}

/**
 * Mock commentary generator for development
 */
function generateMockCommentary(
  prompt: string,
  options: TerryCommentaryOptions
): TerryCommentaryResult {
  const mockResponses = {
    witty: {
      text: "Right, apparently someone's prepared to pay actual money for a striker who couldn't hit a barn door with a banjo. The beautiful game, ladies and gentlemen.",
      main: "Barn Door Banjo Striker Saga",
      subtitle: "Someone's getting sacked for this"
    },
    sarcastic: {
      text: "Oh brilliant, another 'preparing a bid' story. That's definitely not the journalistic equivalent of 'my dad works at Nintendo'. Definitely real news happening here.",
      main: "Preparing to Prepare to Maybe Bid",
      subtitle: "Journalism has left the building"
    },
    excited: {
      text: "Bloody hell, they've actually done it. The mad bastards have only gone and signed someone decent. The Terry needs a sit down. This is not normal.",
      main: "Actual Competence Detected",
      subtitle: "The Terry is shook"
    },
    analytical: {
      text: "Let's examine the claim that a Championship midfielder is worth £80 million. No wait, let's not, because that would require acknowledging this nonsense as potentially real. Moving on.",
      main: "Economics Has Left The Chat",
      subtitle: "Numbers are just vibes now"
    }
  };
  
  const style = options.style || 'witty';
  const response = mockResponses[style];
  
  return {
    ...response,
    html: `<p>${response.text}</p>`,
    voiceConsistencyScore: 0.85,
  };
}

/**
 * Call AI service (OpenAI/Anthropic)
 */
async function callAIService(
  systemPrompt: string,
  userPrompt: string,
  length: TerryCommentaryOptions['length']
): Promise<any> {
  const maxTokens = {
    short: 150,
    medium: 300,
    long: 600
  };
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens[length || 'medium'],
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Try to parse as JSON if it looks like structured data
    try {
      const parsed = JSON.parse(content);
      return { text: content, ...parsed };
    } catch {
      // If not JSON, return as text
      return { text: content };
    }
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
}

/**
 * Convert text to HTML
 */
function convertToHTML(text: string): string {
  // Split into paragraphs
  const paragraphs = text.split('\n\n');
  
  return paragraphs
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('\n');
}

/**
 * Parse structured response from AI
 */
function parseStructuredResponse(response: any): Partial<TerryCommentaryResult> {
  // If AI returns JSON structure
  if (response.main && response.subtitle) {
    return {
      main: response.main,
      subtitle: response.subtitle,
    };
  }
  
  // Try to extract from text
  const lines = response.text.split('\n');
  if (lines.length >= 2) {
    return {
      main: lines[0].trim(),
      subtitle: lines[1].trim(),
    };
  }
  
  return {};
}

/**
 * Calculate voice consistency score
 */
function calculateVoiceScore(text: string): number {
  let score = 0.5; // Base score
  
  // Check for Terry voice markers
  const terryMarkers = [
    /the terry/i,
    /proper mental/i,
    /absolute scenes/i,
    /lost the plot/i,
    /bloody hell/i,
    /mad bastards/i,
    /christ alive/i,
    /shambles/i,
    /nonsense/i,
  ];
  
  terryMarkers.forEach(marker => {
    if (marker.test(text)) {
      score += 0.05;
    }
  });
  
  // Check for British spelling
  const britishSpelling = [
    /realise/i,
    /colour/i,
    /favourite/i,
    /centre/i,
  ];
  
  britishSpelling.forEach(spelling => {
    if (spelling.test(text)) {
      score += 0.025;
    }
  });
  
  // Penalize non-Terry elements
  if (/[😀-🙏]/u.test(text) && !text.includes('emoji')) {
    score -= 0.1; // Unwanted emojis
  }
  
  if (/awesome|amazing|fantastic/i.test(text)) {
    score -= 0.05; // Too positive
  }
  
  return Math.max(0, Math.min(1, score));
}

// Type definitions

export interface TerryCommentaryResult {
  text: string;
  html?: string;
  main?: string;
  subtitle?: string;
  voiceConsistencyScore: number;
}