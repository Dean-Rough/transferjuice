/**
 * Terry-Style Briefing Title Generator
 * Creates engaging headlines with The Terry's distinctive humor
 */

import { BriefingTitle, BriefingSection } from '@/lib/types/briefing';

export interface TitleContext {
  mainTransfers: string[]; // Key transfers mentioned
  clubs: string[]; // Clubs involved
  players: string[]; // Players mentioned
  transferTypes: string[]; // signing, rumour, medical, etc.
  fees: number[]; // Transfer fees mentioned
  sections: BriefingSection[]; // All content sections
  shitTierCount: number; // Number of shit-tier sources mocked
  breakingNews: boolean; // Is there breaking news?
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late';
}

export interface TitleTemplate {
  pattern: string;
  variables: string[];
  minElements: number; // Minimum required context elements
  weight: number; // Selection probability weight
  timeRestriction?: 'morning' | 'afternoon' | 'evening';
}

export class TitleGenerator {
  private static readonly TITLE_TEMPLATES: TitleTemplate[] = [
    // Transfer fee chaos
    {
      pattern: "{club}'s £{fee}m Gamble on a Man Who {action}",
      variables: ['club', 'fee', 'action'],
      minElements: 2,
      weight: 10,
    },
    {
      pattern: "{player} to {club} for €{fee}m (Because Apparently Money Has No Meaning)",
      variables: ['player', 'club', 'fee'],
      minElements: 3,
      weight: 8,
    },
    {
      pattern: "How {club} Managed to Spend £{fee}m on {description}",
      variables: ['club', 'fee', 'description'],
      minElements: 2,
      weight: 9,
    },

    // Transfer strategy mockery
    {
      pattern: "{club}'s Transfer Strategy Resembles {comparison}",
      variables: ['club', 'comparison'],
      minElements: 1,
      weight: 8,
    },
    {
      pattern: "{club} Continue Their Descent Into {description}",
      variables: ['club', 'description'],
      minElements: 1,
      weight: 7,
    },
    {
      pattern: "The Sort of {type} That Makes {reaction}",
      variables: ['type', 'reaction'],
      minElements: 1,
      weight: 6,
    },

    // Breaking news sarcasm
    {
      pattern: "{player} Does Something {adjective} (Shocking Absolutely No One)",
      variables: ['player', 'adjective'],
      minElements: 1,
      weight: 7,
    },
    {
      pattern: "Breaking: {club} {action} and Other {description}",
      variables: ['club', 'action', 'description'],
      minElements: 2,
      weight: 9,
    },

    // Time-specific titles
    {
      pattern: "Your Morning Dose of {description}",
      variables: ['description'],
      minElements: 1,
      weight: 6,
      timeRestriction: 'morning',
    },
    {
      pattern: "Afternoon Update: {club} Still {action}",
      variables: ['club', 'action'],
      minElements: 2,
      weight: 5,
      timeRestriction: 'afternoon',
    },
    {
      pattern: "End of Day Roundup: {description} You're Welcome",
      variables: ['description'],
      minElements: 1,
      weight: 5,
      timeRestriction: 'evening',
    },

    // General chaos
    {
      pattern: "Modern Football Continues Its {description}",
      variables: ['description'],
      minElements: 0,
      weight: 5,
    },
    {
      pattern: "Today's Transfer Chaos: {description}",
      variables: ['description'],
      minElements: 1,
      weight: 6,
    },
    {
      pattern: "{number} Ways {club} Can Disappoint Their Fanbase",
      variables: ['number', 'club'],
      minElements: 1,
      weight: 7,
    },
  ];

  private static readonly VARIABLE_GENERATORS = {
    action: [
      "Can't Tie His Boots",
      "Thinks Tactics Are a Type of Mint",
      "Costs More Than Most People's Houses",
      "Wouldn't Start for Your Sunday League Team",
      "Has the Touch of a Drunk Rhinoceros",
      "Moves Like a Shopping Trolley",
      "Negotiates Like a Confused Tourist",
      "Manages Money Like a Lottery Winner",
      "Makes Decisions with a Magic 8-Ball",
      "Understands Football Like I Understand Quantum Physics",
    ],
    
    comparison: [
      "a Drunk Octopus Playing Piano",
      "a Toddler with a Credit Card",
      "Throwing Darts at a Board Blindfolded",
      "a Broken Slot Machine",
      "Someone Playing Football Manager After 6 Pints",
      "a Random Number Generator",
      "a Chimp with a Typewriter",
      "Monopoly Money Transactions",
      "a Fever Dream",
      "Performance Art",
    ],
    
    description: [
      "Transfer Chaos",
      "Beautiful Madness",
      "Expensive Mistakes",
      "Financial Insanity",
      "Tactical Confusion",
      "Administrative Incompetence",
      "Magnificent Absurdity",
      "Professional Disappointment",
      "Organized Chaos",
      "Billionaire Tantrums",
    ],
    
    adjective: [
      "Predictably Unpredictable",
      "Expensively Pointless",
      "Magnificently Stupid",
      "Beautifully Chaotic",
      "Professionally Confusing",
      "Tactically Questionable",
      "Financially Reckless",
      "Surprisingly Sensible",
      "Delightfully Mental",
      "Properly Unhinged",
    ],
    
    reaction: [
      "Accountants Weep",
      "Fans Question Reality",
      "Agents Buy New Yachts",
      "Economists Have Breakdowns",
      "Therapists Rich",
      "Statisticians Quit",
      "Commentators Speechless",
      "Lawyers Millionaires",
      "Journalists Existential",
      "Everyone Confused",
    ],
    
    number: [
      "47", "73", "23", "89", "156", "12", "99", "42", "17", "666"
    ],
  };

  /**
   * Generate a Terry-style title for a briefing
   */
  static generateTitle(timestamp: Date, context: TitleContext): BriefingTitle {
    const timeOfDay = this.getTimeOfDay(timestamp);
    const availableTemplates = this.filterTemplatesByTime(timeOfDay);
    
    // Score templates based on available context
    const scoredTemplates = availableTemplates.map(template => ({
      template,
      score: this.scoreTemplate(template, context),
    }));
    
    // Filter templates that can be fulfilled
    const viableTemplates = scoredTemplates.filter(scored => scored.score > 0);
    
    if (viableTemplates.length === 0) {
      // Fallback to generic title
      return this.generateFallbackTitle(timestamp, context);
    }
    
    // Select template weighted by score
    const selectedTemplate = this.selectWeightedTemplate(viableTemplates);
    const funnyTitle = this.fillTemplate(selectedTemplate.template, context);
    
    return this.formatBriefingTitle(timestamp, funnyTitle);
  }

  /**
   * Generate multiple title options for selection
   */
  static generateTitleOptions(timestamp: Date, context: TitleContext, count: number = 5): BriefingTitle[] {
    const titles: BriefingTitle[] = [];
    const timeOfDay = this.getTimeOfDay(timestamp);
    const availableTemplates = this.filterTemplatesByTime(timeOfDay);
    
    // Generate unique titles
    const usedPatterns = new Set<string>();
    
    for (let i = 0; i < count && usedPatterns.size < availableTemplates.length; i++) {
      const scoredTemplates = availableTemplates
        .filter(template => !usedPatterns.has(template.pattern))
        .map(template => ({
          template,
          score: this.scoreTemplate(template, context),
        }))
        .filter(scored => scored.score > 0);
      
      if (scoredTemplates.length === 0) break;
      
      const selectedTemplate = this.selectWeightedTemplate(scoredTemplates);
      usedPatterns.add(selectedTemplate.template.pattern);
      
      const funnyTitle = this.fillTemplate(selectedTemplate.template, context);
      titles.push(this.formatBriefingTitle(timestamp, funnyTitle));
    }
    
    return titles;
  }

  /**
   * Extract context from briefing sections
   */
  static extractContextFromSections(sections: BriefingSection[]): Partial<TitleContext> {
    const context: Partial<TitleContext> = {
      mainTransfers: [],
      clubs: [],
      players: [],
      transferTypes: [],
      fees: [],
      shitTierCount: 0,
      breakingNews: false,
    };

    sections.forEach(section => {
      // Extract clubs (look for common club patterns)
      const clubMatches = section.content.match(/\b(Arsenal|Chelsea|Manchester United|Liverpool|Real Madrid|Barcelona|Bayern Munich|PSG|Juventus|AC Milan|Inter Milan|Tottenham|Manchester City|Newcastle|Brighton|Aston Villa|West Ham)\b/gi);
      if (clubMatches) {
        context.clubs = [...(context.clubs || []), ...clubMatches];
      }

      // Extract players from playerMentions
      if (section.playerMentions) {
        context.players = [...(context.players || []), ...section.playerMentions];
      }

      // Extract fees (look for £ or € amounts)
      const feeMatches = section.content.match(/[£€](\d+(?:\.\d+)?)m/gi);
      if (feeMatches) {
        const fees = feeMatches.map(match => parseFloat(match.replace(/[£€m]/g, '')));
        context.fees = [...(context.fees || []), ...fees];
      }

      // Check for breaking news
      if (section.content.toLowerCase().includes('breaking') || section.content.includes('🚨')) {
        context.breakingNews = true;
      }

      // Count shit-tier mockery
      if (section.type === 'bullshit_corner') {
        context.shitTierCount = (context.shitTierCount || 0) + 1;
      }
    });

    // Remove duplicates
    context.clubs = [...new Set(context.clubs || [])];
    context.players = [...new Set(context.players || [])];

    return context;
  }

  private static getTimeOfDay(timestamp: Date): 'morning' | 'afternoon' | 'evening' | 'late' {
    const hour = timestamp.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'late';
  }

  private static filterTemplatesByTime(timeOfDay: string): TitleTemplate[] {
    return this.TITLE_TEMPLATES.filter(template => 
      !template.timeRestriction || template.timeRestriction === timeOfDay
    );
  }

  private static scoreTemplate(template: TitleTemplate, context: TitleContext): number {
    let score = template.weight;
    
    // Check if we have enough context elements
    const availableElements = this.countAvailableElements(context);
    if (availableElements < template.minElements) {
      return 0; // Can't fulfill this template
    }
    
    // Bonus for having rich context
    if (context.clubs && context.clubs.length > 0) score += 2;
    if (context.players && context.players.length > 0) score += 2;
    if (context.fees && context.fees.length > 0) score += 3;
    if (context.breakingNews) score += 5;
    if (context.shitTierCount && context.shitTierCount > 0) score += 1;
    
    return score;
  }

  private static countAvailableElements(context: TitleContext): number {
    let count = 0;
    if (context.clubs && context.clubs.length > 0) count++;
    if (context.players && context.players.length > 0) count++;
    if (context.fees && context.fees.length > 0) count++;
    if (context.transferTypes && context.transferTypes.length > 0) count++;
    return count;
  }

  private static selectWeightedTemplate(scoredTemplates: Array<{ template: TitleTemplate; score: number }>): TitleTemplate {
    const totalWeight = scoredTemplates.reduce((sum, scored) => sum + scored.score, 0);
    let random = Math.random() * totalWeight;
    
    for (const scored of scoredTemplates) {
      random -= scored.score;
      if (random <= 0) {
        return scored.template;
      }
    }
    
    // Fallback to first template
    return scoredTemplates[0].template;
  }

  private static fillTemplate(template: TitleTemplate, context: TitleContext): string {
    let title = template.pattern;
    
    template.variables.forEach(variable => {
      const placeholder = `{${variable}}`;
      if (title.includes(placeholder)) {
        const value = this.getVariableValue(variable, context);
        title = title.replace(placeholder, value);
      }
    });
    
    return title;
  }

  private static getVariableValue(variable: string, context: TitleContext): string {
    switch (variable) {
      case 'club':
        return context.clubs && context.clubs.length > 0 
          ? context.clubs[Math.floor(Math.random() * context.clubs.length)]
          : 'Arsenal'; // Default fallback
          
      case 'player':
        return context.players && context.players.length > 0
          ? context.players[Math.floor(Math.random() * context.players.length)]
          : 'Haaland'; // Default fallback
          
      case 'fee':
        return context.fees && context.fees.length > 0
          ? context.fees[Math.floor(Math.random() * context.fees.length)].toString()
          : (Math.floor(Math.random() * 100) + 20).toString(); // Random fee
          
      default:
        // Use variable generators
        const options = this.VARIABLE_GENERATORS[variable as keyof typeof this.VARIABLE_GENERATORS];
        if (options) {
          return options[Math.floor(Math.random() * options.length)];
        }
        return variable; // Fallback to variable name
    }
  }

  private static generateFallbackTitle(timestamp: Date, context: TitleContext): BriefingTitle {
    const fallbacks = [
      "Today's Transfer Chaos: Expensive Mistakes and Beautiful Madness",
      "Football Continues Its Descent Into Magnificent Absurdity",
      "Another Day, Another £100m Gamble on Professional Disappointment",
      "Transfer Window Updates: Your Daily Dose of Billionaire Tantrums",
      "Modern Football: Where Money Has No Meaning and Sense Even Less",
    ];
    
    const funnyTitle = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return this.formatBriefingTitle(timestamp, funnyTitle);
  }

  private static formatBriefingTitle(timestamp: Date, funnyTitle: string): BriefingTitle {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = days[timestamp.getDay()];
    const hour = timestamp.getHours().toString().padStart(2, '0') + ':00';
    const month = months[timestamp.getMonth()];
    const year = "'" + timestamp.getFullYear().toString().slice(-2);
    
    const full = `${day} ${hour} Briefing ${month} ${year} - ${funnyTitle}`;
    const slug = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')}-${timestamp.getHours().toString().padStart(2, '0')}`;
    
    return {
      full,
      funny: funnyTitle,
      day,
      hour,
      month,
      year,
      timestamp,
      slug,
    };
  }
}

// Export convenience function
export const generateBriefingTitle = (timestamp: Date, context: TitleContext) => 
  TitleGenerator.generateTitle(timestamp, context);

export const generateTitleOptions = (timestamp: Date, context: TitleContext, count?: number) =>
  TitleGenerator.generateTitleOptions(timestamp, context, count);

export const extractTitleContext = (sections: BriefingSection[]) =>
  TitleGenerator.extractContextFromSections(sections);