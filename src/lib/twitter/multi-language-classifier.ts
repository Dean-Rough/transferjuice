/**
 * Multi-Language Transfer Detection System
 * Supports global transfer detection across 5 major football languages
 */

export interface TransferKeywords {
  language: string;
  keywords: {
    confirmed: string[];
    advanced: string[];
    talks: string[];
    medical: string[];
    loan: string[];
    permanent: string[];
    fee: string[];
    agent: string[];
  };
}

// Multi-language transfer detection keywords as specified in roadmap
export const TRANSFER_KEYWORDS: Record<string, TransferKeywords> = {
  en: {
    language: "English",
    keywords: {
      confirmed: [
        "signing",
        "deal",
        "here we go",
        "confirmed",
        "official",
        "announcement",
      ],
      advanced: [
        "advanced talks",
        "close to",
        "agreement",
        "personal terms",
        "medical",
      ],
      talks: [
        "talks",
        "negotiations",
        "discussing",
        "interested",
        "monitoring",
      ],
      medical: [
        "medical",
        "medical tests",
        "medical booked",
        "medical scheduled",
      ],
      loan: ["loan", "on loan", "temporary", "loan deal", "loan move"],
      permanent: ["permanent", "permanent deal", "full transfer", "bought"],
      fee: ["fee", "million", "€", "£", "$", "transfer fee", "price"],
      agent: ["agent", "representatives", "intermediary", "advisor"],
    },
  },
  es: {
    language: "Spanish",
    keywords: {
      confirmed: ["fichaje", "traspaso", "oficial", "confirmado", "anunciado"],
      advanced: ["acuerdo", "acuerdo cerrado", "muy cerca", "casi hecho"],
      talks: ["negociaciones", "conversaciones", "contactos", "interesado"],
      medical: ["reconocimiento médico", "médico", "examen médico"],
      loan: ["cesión", "préstamo", "cedido", "temporal"],
      permanent: ["traspaso", "compra", "definitivo", "permanente"],
      fee: ["precio", "millones", "€", "coste", "valor", "traspaso"],
      agent: ["agente", "representante", "intermediario"],
    },
  },
  it: {
    language: "Italian",
    keywords: {
      confirmed: ["trasferimento", "ufficiale", "annuncio", "comunicato"],
      advanced: ["accordo", "vicinissimo", "quasi fatto", "dettagli"],
      talks: ["trattative", "contatti", "interessato", "sondaggi"],
      medical: ["visite mediche", "mediche", "controlli medici"],
      loan: ["prestito", "cessione", "temporaneo"],
      permanent: ["trasferimento", "riscatto", "acquisto", "definitivo"],
      fee: ["prezzo", "milioni", "€", "cifra", "costo"],
      agent: ["agente", "procuratore", "intermediario"],
    },
  },
  fr: {
    language: "French",
    keywords: {
      confirmed: ["transfert", "officiel", "signature", "annonce"],
      advanced: ["accord", "très proche", "presque bouclé", "détails"],
      talks: ["négociations", "discussions", "contacts", "intéressé"],
      medical: ["visite médicale", "médical", "examens"],
      loan: ["prêt", "temporaire", "prêté"],
      permanent: ["transfert", "rachat", "définitif", "achat"],
      fee: ["prix", "millions", "€", "montant", "coût"],
      agent: ["agent", "représentant", "intermédiaire"],
    },
  },
  de: {
    language: "German",
    keywords: {
      confirmed: ["Wechsel", "Transfer", "offiziell", "Verpflichtung"],
      advanced: ["Einigung", "kurz vor", "fast perfekt", "Details"],
      talks: ["Verhandlungen", "Gespräche", "Interesse", "Kontakt"],
      medical: ["Medizincheck", "ärztliche Untersuchung", "Medical"],
      loan: ["Leihe", "ausgeliehen", "temporär"],
      permanent: ["Transfer", "Kauf", "fest", "dauerhaft"],
      fee: ["Ablöse", "Millionen", "€", "Summe", "Preis"],
      agent: ["Berater", "Agent", "Vermittler"],
    },
  },
  pt: {
    language: "Portuguese",
    keywords: {
      confirmed: ["contratação", "transferência", "oficial", "anúncio"],
      advanced: ["acordo", "muito perto", "quase fechado", "acerto"],
      talks: ["negociações", "conversas", "interesse", "sondagem"],
      medical: ["exames médicos", "médico", "avaliação médica"],
      loan: ["empréstimo", "cedido", "temporário"],
      permanent: ["contratação", "compra", "definitivo", "permanente"],
      fee: ["valor", "milhões", "R$", "€", "preço"],
      agent: ["empresário", "agente", "representante"],
    },
  },
};

export interface TransferClassification {
  isTransferRelated: boolean;
  confidence: number;
  language: string;
  transferType?:
    | "OFFICIAL"
    | "CONFIRMED"
    | "MEDICAL"
    | "ADVANCED"
    | "TALKS"
    | "RUMOUR";
  keywords: string[];
  reasonCode: string;
  explanation: string;
}

export class MultiLanguageTransferClassifier {
  /**
   * Classify a tweet for transfer relevance across multiple languages
   */
  async classifyTweet(
    tweetText: string,
    authorLanguage?: string,
  ): Promise<TransferClassification> {
    const text = tweetText.toLowerCase();

    // Try to detect language first, or use author's primary language
    const detectedLanguage = this.detectLanguage(text, authorLanguage);
    const keywords =
      TRANSFER_KEYWORDS[detectedLanguage] || TRANSFER_KEYWORDS.en;

    // Check for transfer relevance
    const matches = this.findKeywordMatches(text, keywords);

    if (matches.length === 0) {
      return {
        isTransferRelated: false,
        confidence: 0.0,
        language: detectedLanguage,
        keywords: [],
        reasonCode: "NO_KEYWORDS",
        explanation: `No transfer-related keywords found in ${keywords.language}`,
      };
    }

    // Determine transfer type and confidence
    const transferType = this.determineTransferType(matches, keywords);
    const confidence = this.calculateConfidence(matches, keywords, text);

    return {
      isTransferRelated: true,
      confidence,
      language: detectedLanguage,
      transferType,
      keywords: matches,
      reasonCode: "KEYWORD_MATCH",
      explanation: `Found ${matches.length} transfer keywords in ${keywords.language}: ${matches.join(", ")}`,
    };
  }

  /**
   * Detect the language of the tweet text
   */
  private detectLanguage(text: string, authorLanguage?: string): string {
    // If author language is provided and supported, use it
    if (authorLanguage && TRANSFER_KEYWORDS[authorLanguage]) {
      return authorLanguage;
    }

    // Simple language detection based on common words and patterns
    const languageScores: Record<string, number> = {};

    Object.entries(TRANSFER_KEYWORDS).forEach(([lang, data]) => {
      languageScores[lang] = 0;

      // Check for language-specific patterns
      Object.values(data.keywords)
        .flat()
        .forEach((keyword) => {
          if (text.includes(keyword.toLowerCase())) {
            languageScores[lang] += 1;
          }
        });
    });

    // Return language with highest score, default to English
    const bestMatch = Object.entries(languageScores).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return bestMatch && bestMatch[1] > 0 ? bestMatch[0] : "en";
  }

  /**
   * Find all matching transfer keywords in the text
   */
  private findKeywordMatches(
    text: string,
    keywords: TransferKeywords,
  ): string[] {
    const matches: string[] = [];

    Object.values(keywords.keywords)
      .flat()
      .forEach((keyword) => {
        if (text.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      });

    return matches;
  }

  /**
   * Determine the most likely transfer type based on keyword matches
   */
  private determineTransferType(
    matches: string[],
    keywords: TransferKeywords,
  ): TransferClassification["transferType"] {
    // Check in order of certainty
    if (matches.some((m) => keywords.keywords.confirmed.includes(m))) {
      return "OFFICIAL";
    }
    if (matches.some((m) => keywords.keywords.medical.includes(m))) {
      return "MEDICAL";
    }
    if (matches.some((m) => keywords.keywords.advanced.includes(m))) {
      return "ADVANCED";
    }
    if (matches.some((m) => keywords.keywords.talks.includes(m))) {
      return "TALKS";
    }

    return "RUMOUR";
  }

  /**
   * Calculate confidence score based on keyword quality and quantity
   */
  private calculateConfidence(
    matches: string[],
    keywords: TransferKeywords,
    text: string,
  ): number {
    let confidence = 0.0;

    // Base confidence from keyword strength
    matches.forEach((match) => {
      if (keywords.keywords.confirmed.includes(match)) confidence += 0.3;
      else if (keywords.keywords.medical.includes(match)) confidence += 0.25;
      else if (keywords.keywords.advanced.includes(match)) confidence += 0.2;
      else if (keywords.keywords.talks.includes(match)) confidence += 0.15;
      else confidence += 0.1;
    });

    // Bonus for multiple keyword types
    const keywordTypes = Object.entries(keywords.keywords).filter(([, words]) =>
      words.some((word) => matches.includes(word)),
    ).length;

    if (keywordTypes > 1) {
      confidence += 0.1;
    }

    // Bonus for financial information
    if (keywords.keywords.fee.some((keyword) => text.includes(keyword))) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  /**
   * Extract entities (players, clubs) from tweet text
   * Enhanced version with multi-language patterns
   */
  async extractEntities(
    text: string,
    language: string = "en",
  ): Promise<{
    players: string[];
    clubs: string[];
    agents: string[];
  }> {
    // This would be enhanced with proper NER for each language
    // For now, return basic pattern matching

    const players: string[] = [];
    const clubs: string[] = [];
    const agents: string[] = [];

    // Basic patterns - would be enhanced with proper NLP
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const names = text.match(namePattern) || [];

    // Simple heuristic: if mentioned with transfer keywords, likely a player
    names.forEach((name) => {
      const keywords = TRANSFER_KEYWORDS[language] || TRANSFER_KEYWORDS.en;
      const hasTransferContext = Object.values(keywords.keywords)
        .flat()
        .some(
          (keyword) =>
            text.toLowerCase().includes(keyword.toLowerCase()) &&
            text.toLowerCase().includes(name.toLowerCase()),
        );

      if (hasTransferContext) {
        players.push(name);
      }
    });

    return { players, clubs, agents };
  }
}

// Export singleton instance
export const multiLanguageClassifier = new MultiLanguageTransferClassifier();
