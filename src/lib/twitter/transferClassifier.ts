/**
 * Multi-language Transfer Content Classification
 * Detects transfer-related content across different languages and regions
 */

import {
  getTransferKeywords,
  getSourceByHandle,
  type ITKSource,
} from "./globalSources";

export interface ClassificationResult {
  isTransferRelated: boolean;
  confidence: number;
  transferType?:
    | "signing"
    | "rumour"
    | "medical"
    | "confirmed"
    | "bid"
    | "personal_terms";
  keywords: string[];
  language?: ITKSource["language"];
  reasonCode: string;
  explanation: string;
}

export interface TweetData {
  id: string;
  text: string;
  author: {
    username: string;
    displayName: string;
  };
  createdAt: string;
  lang?: string;
  metrics?: {
    retweets: number;
    likes: number;
    replies: number;
  };
  urls?: string[];
  media?: Array<{
    type: "photo" | "video";
    url: string;
  }>;
}

/**
 * Language detection patterns
 */
const LANGUAGE_PATTERNS = {
  en: /\b(the|and|or|is|are|was|were|have|has|will|would|could|should)\b/gi,
  es: /\b(el|la|los|las|y|o|es|son|fue|fueron|tiene|tendrá|podría|debería)\b/gi,
  it: /\b(il|la|i|le|e|o|è|sono|era|erano|ha|avrà|potrebbe|dovrebbe)\b/gi,
  fr: /\b(le|la|les|et|ou|est|sont|était|étaient|a|aura|pourrait|devrait)\b/gi,
  de: /\b(der|die|das|und|oder|ist|sind|war|waren|hat|wird|könnte|sollte)\b/gi,
  pt: /\b(o|a|os|as|e|ou|é|são|foi|foram|tem|terá|poderia|deveria)\b/gi,
};

/**
 * Transfer context patterns by language
 */
const TRANSFER_CONTEXTS = {
  en: {
    confirmed: [
      "done deal",
      "here we go",
      "official",
      "confirmed",
      "signed",
      "completed",
    ],
    rumour: [
      "linked",
      "interested",
      "monitoring",
      "considering",
      "could",
      "might",
      "rumoured",
    ],
    medical: ["medical", "medicals", "tests", "examination", "check-up"],
    bid: ["bid", "offer", "proposed", "rejected", "accepted", "negotiating"],
    personal_terms: [
      "personal terms",
      "terms agreed",
      "contract agreed",
      "wages agreed",
    ],
  },
  es: {
    confirmed: ["hecho", "oficial", "confirmado", "firmado", "completado"],
    rumour: [
      "vinculado",
      "interesado",
      "monitoreando",
      "considerando",
      "podría",
      "rumoreado",
    ],
    medical: ["reconocimiento médico", "exámenes", "pruebas médicas"],
    bid: ["oferta", "propuesta", "rechazado", "aceptado", "negociando"],
    personal_terms: [
      "términos personales",
      "contrato acordado",
      "salario acordado",
    ],
  },
  it: {
    confirmed: ["fatto", "ufficiale", "confermato", "firmato", "completato"],
    rumour: [
      "collegato",
      "interessato",
      "monitoraggio",
      "considerando",
      "potrebbe",
      "voci",
    ],
    medical: ["visite mediche", "esami", "controlli medici"],
    bid: ["offerta", "proposta", "rifiutato", "accettato", "trattativa"],
    personal_terms: [
      "accordo personale",
      "contratto concordato",
      "stipendio concordato",
    ],
  },
  fr: {
    confirmed: ["fait", "officiel", "confirmé", "signé", "terminé"],
    rumour: [
      "lié",
      "intéressé",
      "surveillance",
      "considérant",
      "pourrait",
      "rumeur",
    ],
    medical: ["visite médicale", "examens", "tests médicaux"],
    bid: ["offre", "proposition", "rejeté", "accepté", "négociation"],
    personal_terms: ["accord personnel", "contrat convenu", "salaire convenu"],
  },
  de: {
    confirmed: [
      "gemacht",
      "offiziell",
      "bestätigt",
      "unterschrieben",
      "abgeschlossen",
    ],
    rumour: [
      "verknüpft",
      "interessiert",
      "beobachtung",
      "erwägt",
      "könnte",
      "gerücht",
    ],
    medical: ["medizincheck", "untersuchungen", "medizinische tests"],
    bid: ["angebot", "vorschlag", "abgelehnt", "akzeptiert", "verhandlung"],
    personal_terms: [
      "persönliche bedingungen",
      "vertrag vereinbart",
      "gehalt vereinbart",
    ],
  },
  pt: {
    confirmed: ["feito", "oficial", "confirmado", "assinado", "completado"],
    rumour: [
      "ligado",
      "interessado",
      "monitoramento",
      "considerando",
      "poderia",
      "rumor",
    ],
    medical: ["exames médicos", "exames", "testes médicos"],
    bid: ["oferta", "proposta", "rejeitado", "aceito", "negociação"],
    personal_terms: [
      "termos pessoais",
      "contrato acordado",
      "salário acordado",
    ],
  },
};

/**
 * Detect language of tweet content
 */
export const detectLanguage = (text: string): ITKSource["language"] => {
  const scores: Record<ITKSource["language"], number> = {
    en: 0,
    es: 0,
    it: 0,
    fr: 0,
    de: 0,
    pt: 0,
  };

  // Count pattern matches for each language
  Object.entries(LANGUAGE_PATTERNS).forEach(([lang, pattern]) => {
    const matches = text.match(pattern);
    scores[lang as ITKSource["language"]] = matches ? matches.length : 0;
  });

  // Return language with highest score, default to English
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "en";

  return (
    (Object.entries(scores).find(
      ([_, score]) => score === maxScore,
    )?.[0] as ITKSource["language"]) || "en"
  );
};

/**
 * Extract transfer-related keywords from text
 */
export const extractTransferKeywords = (
  text: string,
  language: ITKSource["language"],
): string[] => {
  const keywords = getTransferKeywords(language);
  const lowerText = text.toLowerCase();

  return keywords.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase()),
  );
};

/**
 * Determine transfer type based on context
 */
export const determineTransferType = (
  text: string,
  language: ITKSource["language"],
): ClassificationResult["transferType"] | undefined => {
  const lowerText = text.toLowerCase();
  const contexts = TRANSFER_CONTEXTS[language];

  // Check each transfer type
  for (const [type, patterns] of Object.entries(contexts)) {
    if (patterns.some((pattern) => lowerText.includes(pattern.toLowerCase()))) {
      return type as ClassificationResult["transferType"];
    }
  }

  return undefined;
};

/**
 * Calculate confidence score based on multiple factors
 */
export const calculateConfidence = (
  text: string,
  keywords: string[],
  source?: ITKSource,
  transferType?: ClassificationResult["transferType"],
): number => {
  let confidence = 0;

  // Keyword density (30% weight)
  const keywordDensity = keywords.length / text.split(" ").length;
  confidence += Math.min(keywordDensity * 3, 0.3);

  // Source reliability (40% weight)
  if (source) {
    confidence += source.reliability * 0.4;
  } else {
    confidence += 0.1; // Unknown source penalty
  }

  // Transfer type specificity (20% weight)
  if (transferType) {
    const typeScores = {
      confirmed: 0.2,
      signing: 0.18,
      medical: 0.15,
      bid: 0.12,
      personal_terms: 0.15,
      rumour: 0.08,
    };
    confidence += typeScores[transferType] || 0.1;
  }

  // Content quality indicators (10% weight)
  const qualityIndicators = ["exclusive", "breaking", "🚨", "✅", "here we go"];
  const hasQualityIndicators = qualityIndicators.some((indicator) =>
    text.toLowerCase().includes(indicator.toLowerCase()),
  );
  if (hasQualityIndicators) confidence += 0.1;

  return Math.min(confidence, 1.0);
};

/**
 * Main classification function
 */
export const classifyTransferContent = (
  tweet: TweetData,
): ClassificationResult => {
  const text = tweet.text;
  const detectedLanguage = detectLanguage(text);
  const source = getSourceByHandle(tweet.author.username);

  // Extract transfer keywords
  const keywords = extractTransferKeywords(text, detectedLanguage);

  // Early exit if no transfer keywords found
  if (keywords.length === 0) {
    return {
      isTransferRelated: false,
      confidence: 0,
      keywords: [],
      language: detectedLanguage,
      reasonCode: "NO_TRANSFER_KEYWORDS",
      explanation: "No transfer-related keywords found in the content",
    };
  }

  // Determine transfer type
  const transferType = determineTransferType(text, detectedLanguage);

  // Calculate confidence
  const confidence = calculateConfidence(text, keywords, source, transferType);

  // Determine if transfer-related based on confidence threshold
  const isTransferRelated = confidence >= 0.3; // 30% minimum confidence

  // Generate explanation
  let explanation = `Found ${keywords.length} transfer keywords in ${detectedLanguage} text`;
  if (source) {
    explanation += ` from ${source.name} (${Math.round(source.reliability * 100)}% reliability)`;
  }
  if (transferType) {
    explanation += ` indicating ${transferType}`;
  }

  return {
    isTransferRelated,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
    transferType,
    keywords,
    language: detectedLanguage,
    reasonCode: isTransferRelated ? "TRANSFER_DETECTED" : "LOW_CONFIDENCE",
    explanation,
  };
};

/**
 * Batch classification for multiple tweets
 */
export const classifyBatchTransferContent = (
  tweets: TweetData[],
): ClassificationResult[] => {
  return tweets.map(classifyTransferContent);
};

/**
 * Filter tweets by confidence threshold
 */
export const filterByConfidence = (
  classifications: ClassificationResult[],
  minConfidence: number = 0.5,
): ClassificationResult[] => {
  return classifications.filter(
    (result) => result.isTransferRelated && result.confidence >= minConfidence,
  );
};

/**
 * Get classification statistics
 */
export const getClassificationStats = (
  classifications: ClassificationResult[],
) => {
  const total = classifications.length;
  const transferRelated = classifications.filter(
    (c) => c.isTransferRelated,
  ).length;
  const highConfidence = classifications.filter(
    (c) => c.confidence >= 0.7,
  ).length;

  const languageStats = classifications.reduce(
    (acc, c) => {
      const lang = c.language || "unknown";
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const typeStats = classifications.reduce(
    (acc, c) => {
      if (c.transferType) {
        acc[c.transferType] = (acc[c.transferType] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total,
    transferRelated,
    highConfidence,
    transferRate: Math.round((transferRelated / total) * 100),
    averageConfidence: Math.round(
      (classifications.reduce((sum, c) => sum + c.confidence, 0) / total) * 100,
    ),
    languageStats,
    typeStats,
  };
};

/**
 * Alias for classifyTransferContent to match expected import
 */
export const classifyTransferTweet = async (
  text: string,
): Promise<ClassificationResult> => {
  // Create a minimal tweet object for classification
  const tweet: TweetData = {
    id: "temp",
    text,
    author: {
      username: "unknown",
      displayName: "Unknown",
    },
    createdAt: new Date().toISOString(),
  };

  return classifyTransferContent(tweet);
};
