import { PrismaClient } from "@prisma/client";
import { CohesiveBriefing } from "./types";

const prisma = new PrismaClient();

interface DailySummaryData {
  completed: any[];
  negotiating: any[];
  contracts: any[];
  rejected: any[];
  interest: any[];
  totalStories: number;
  totalFees: number;
  topClubs: Array<[string, number]>;
  topStories: any[];
}

// Generate HTML content for daily summary
export async function generateDailySummaryHTML(hours: number = 24): Promise<CohesiveBriefing> {
  const sinceTime = new Date();
  sinceTime.setHours(sinceTime.getHours() - hours);
  
  // Get all stories from the time period
  const allStories = await prisma.story.findMany({
    where: {
      tweet: {
        scrapedAt: {
          gte: sinceTime
        }
      }
    },
    include: {
      tweet: {
        include: {
          source: true
        }
      }
    },
    orderBy: {
      tweet: {
        scrapedAt: 'desc'
      }
    }
  });
  
  // Filter out cohesive briefing stories
  const transferStories = allStories.filter(s => {
    const meta = s.metadata as any;
    return meta?.type !== 'cohesive' && meta?.type !== 'daily_summary';
  });
  
  // Group by status
  const completed = transferStories.filter(s => (s.metadata as any)?.status === 'completed');
  const negotiating = transferStories.filter(s => (s.metadata as any)?.status === 'negotiating');
  const interest = transferStories.filter(s => (s.metadata as any)?.status === 'interest');
  const rejected = transferStories.filter(s => (s.metadata as any)?.status === 'rejected');
  const contracts = transferStories.filter(s => (s.metadata as any)?.type === 'contract_extension');
  
  // Calculate total fees
  const totalFees = completed.reduce((sum, story) => {
    const meta = story.metadata as any;
    if (meta.fee) {
      const value = parseFloat(meta.fee.replace(/[^0-9.]/g, ''));
      return sum + (value || 0);
    }
    return sum;
  }, 0);
  
  // Get most active clubs
  const clubActivity = new Map<string, number>();
  transferStories.forEach(story => {
    const meta = story.metadata as any;
    [meta.fromClub, meta.toClub].filter(Boolean).forEach(club => {
      clubActivity.set(club, (clubActivity.get(club) || 0) + 1);
    });
  });
  
  const topClubs = Array.from(clubActivity.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Get top stories by importance
  const topStories = [...transferStories]
    .sort((a, b) => {
      const aImp = (a.metadata as any)?.importance || 0;
      const bImp = (b.metadata as any)?.importance || 0;
      return bImp - aImp;
    })
    .slice(0, 5);
  
  // Prepare data
  const summaryData: DailySummaryData = {
    completed,
    negotiating,
    contracts,
    rejected,
    interest,
    totalStories: transferStories.length,
    totalFees,
    topClubs,
    topStories
  };
  
  // Generate HTML content
  const content = generateSummaryHTML(summaryData);
  
  // Get key players and clubs for metadata
  const keyPlayers = [...new Set(topStories.map(s => (s.metadata as any).player))].slice(0, 8);
  const keyClubs = [...new Set(topClubs.map(([club]) => club))];
  
  // Try to get an image from top stories
  let mainImage: string | undefined;
  if (topStories.length > 0) {
    const topPlayer = (topStories[0].metadata as any).player;
    const playerImage = await getPlayerImage(topPlayer);
    if (playerImage) {
      mainImage = playerImage;
    }
  }
  
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return {
    title: `Daily Transfer Summary - ${date}`,
    content,
    metadata: {
      keyPlayers,
      keyClubs,
      mainImage,
      playerImages: {},
      summaryData: summaryData
    }
  };
}

// Generate the HTML content
function generateSummaryHTML(data: DailySummaryData): string {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  
  let html = '';
  
  // Header with stats grid
  html += `
<div class="daily-summary-header mb-8">
  <h1 class="text-3xl font-bold mb-6">Daily Transfer Summary - ${date}</h1>
  
  <div class="stats-grid grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
    <div class="stat-card bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
      <div class="stat-number text-3xl font-bold text-green-500">${data.completed.length}</div>
      <div class="stat-label text-sm text-muted-foreground">Completed</div>
    </div>
    
    <div class="stat-card bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
      <div class="stat-number text-3xl font-bold text-yellow-500">${data.negotiating.length}</div>
      <div class="stat-label text-sm text-muted-foreground">Negotiating</div>
    </div>
    
    <div class="stat-card bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
      <div class="stat-number text-3xl font-bold text-blue-500">${data.contracts.length}</div>
      <div class="stat-label text-sm text-muted-foreground">Extensions</div>
    </div>
    
    <div class="stat-card bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
      <div class="stat-number text-3xl font-bold text-red-500">${data.rejected.length}</div>
      <div class="stat-label text-sm text-muted-foreground">Rejected</div>
    </div>
    
    <div class="stat-card bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
      <div class="stat-number text-3xl font-bold text-orange-500">£${data.totalFees}m</div>
      <div class="stat-label text-sm text-muted-foreground">Total Fees</div>
    </div>
  </div>
</div>
`;
  
  // Completed transfers section
  if (data.completed.length > 0) {
    html += `
<div class="completed-section mb-8">
  <h2 class="text-2xl font-bold mb-4 text-green-500">✅ Done Deals</h2>
  <div class="transfer-list space-y-4">`;
    
    for (const story of data.completed) {
      const meta = story.metadata as any;
      html += `
    <div class="transfer-item bg-card border border-border rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">
            <strong class="text-orange-500">${meta.player}</strong>
          </h3>
          <p class="text-sm text-muted-foreground">
            ${meta.fromClub || 'Unknown'} → <strong class="text-orange-500">${meta.toClub || 'Unknown'}</strong>
            ${meta.fee ? `<strong class="text-green-500 ml-2">${meta.fee}</strong>` : ''}
          </p>
          ${meta.type === 'loan' ? `<p class="text-xs text-blue-500 mt-1">Loan (${meta.loanDuration || 'duration TBC'})</p>` : ''}
        </div>
        ${meta.isHereWeGo ? '<div class="text-green-500 font-semibold">✓ Here We Go!</div>' : ''}
      </div>
    </div>`;
    }
    
    html += `
  </div>
</div>`;
  }
  
  // Ongoing negotiations
  if (data.negotiating.length > 0) {
    html += `
<div class="negotiating-section mb-8">
  <h2 class="text-2xl font-bold mb-4 text-yellow-500">🔄 Ongoing Negotiations</h2>
  <div class="transfer-list space-y-3">`;
    
    for (const story of data.negotiating.slice(0, 5)) {
      const meta = story.metadata as any;
      html += `
    <div class="transfer-item bg-card/50 border border-border/50 rounded-lg p-3">
      <p>
        <strong class="text-orange-500">${meta.player}</strong> to 
        <strong class="text-orange-500">${meta.toClub || 'Unknown'}</strong>
        ${meta.fee ? `- Expected: <strong class="text-green-500">${meta.fee}</strong>` : ''}
      </p>
    </div>`;
    }
    
    html += `
  </div>
</div>`;
  }
  
  // Top stories section
  if (data.topStories.length > 0) {
    html += `
<div class="top-stories-section mb-8">
  <h2 class="text-2xl font-bold mb-4">⭐ Biggest Stories of the Day</h2>
  <div class="stories-list space-y-4">`;
    
    data.topStories.forEach((story, index) => {
      const meta = story.metadata as any;
      html += `
    <div class="story-item">
      <h3 class="text-lg font-semibold mb-1">
        ${index + 1}. <strong class="text-orange-500">${meta.player}</strong>
        <span class="text-sm text-muted-foreground ml-2">(${meta.importance}/10)</span>
      </h3>
      <p class="text-sm">
        ${meta.fromClub || 'Unknown'} → <strong class="text-orange-500">${meta.toClub || 'Unknown'}</strong>
        <span class="text-muted-foreground"> - ${meta.status}</span>
        ${meta.fee ? `<strong class="text-green-500 ml-2">${meta.fee}</strong>` : ''}
      </p>
    </div>`;
    });
    
    html += `
  </div>
</div>`;
  }
  
  // Most active clubs
  if (data.topClubs.length > 0) {
    html += `
<div class="clubs-section mb-8">
  <h2 class="text-2xl font-bold mb-4">🏆 Most Active Clubs</h2>
  <div class="clubs-table bg-card border border-border rounded-lg p-4">
    <table class="w-full">
      <tbody>`;
    
    data.topClubs.forEach(([club, count], index) => {
      html += `
        <tr class="border-b border-border/50 last:border-0">
          <td class="py-2 font-semibold">${index + 1}.</td>
          <td class="py-2"><strong class="text-orange-500">${club}</strong></td>
          <td class="py-2 text-right">
            <span class="text-muted-foreground">${count} ${count === 1 ? 'deal' : 'deals'}</span>
          </td>
        </tr>`;
    });
    
    html += `
      </tbody>
    </table>
  </div>
</div>`;
  }
  
  // Summary footer
  html += `
<div class="summary-footer mt-8 pt-4 border-t border-border text-sm text-muted-foreground">
  <p>Transfer activity from the last 24 hours. ${data.totalStories} total stories tracked.</p>
</div>`;
  
  return html;
}

// Fetch player image helper
async function getPlayerImage(playerName: string): Promise<string | null> {
  try {
    const wikiName = playerName.replace(' ', '_');
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.thumbnail?.source || null;
    }
  } catch (error) {
    console.error(`Failed to fetch image for ${playerName}:`, error);
  }
  return null;
}