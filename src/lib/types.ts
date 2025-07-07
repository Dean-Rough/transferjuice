// RSS Feed Types
export interface RSSItem {
  id: string;
  url: string;
  title: string;
  content_text: string;
  content_html: string;
  image?: string;
  date_published: string;
  authors: { name: string }[];
  attachments?: { url: string }[];
}

export interface RSSFeed {
  version: string;
  title: string;
  items: RSSItem[];
}

// Briefing Types
export interface CohesiveBriefing {
  title: string;
  content: string;
  metadata: {
    keyPlayers: string[];
    keyClubs: string[];
    mainImage?: string;
    playerImages?: Record<string, string>;
    summaryData?: any; // For daily summaries
  };
}