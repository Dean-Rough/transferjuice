/**
 * Polaroid Management System
 * Handles player image sourcing from /polaroids/ folder with rotation and placement
 */

import { promises as fs } from 'fs';
import path from 'path';
import { PolaroidImage } from '@/lib/types/briefing';

export interface PolaroidFile {
  filename: string;
  playerName: string;
  fullPath: string;
  extension: string;
  size?: number;
  lastModified?: Date;
}

export interface PolaroidPlacement {
  image: PolaroidImage;
  scrollPosition: number;
  textSection: string;
  visibility: 'visible' | 'fade-in' | 'fade-out' | 'hidden';
}

export class PolaroidManager {
  private static polaroidCache: Map<string, PolaroidFile[]> = new Map();
  private static lastCacheUpdate: Date | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all available polaroid files from /polaroids/ directory
   */
  static async getAvailablePolaroids(): Promise<PolaroidFile[]> {
    const now = new Date();
    
    // Check cache freshness
    if (
      this.lastCacheUpdate &&
      this.polaroidCache.has('all') &&
      (now.getTime() - this.lastCacheUpdate.getTime()) < this.CACHE_DURATION
    ) {
      return this.polaroidCache.get('all') || [];
    }

    try {
      const polaroidDir = path.join(process.cwd(), 'public', 'polaroids');
      
      // Ensure directory exists
      try {
        await fs.access(polaroidDir);
      } catch {
        console.warn('Polaroids directory not found, creating it...');
        await fs.mkdir(polaroidDir, { recursive: true });
        return [];
      }

      const files = await fs.readdir(polaroidDir, { withFileTypes: true });
      const polaroidFiles: PolaroidFile[] = [];

      for (const file of files) {
        if (file.isFile() && this.isImageFile(file.name)) {
          const fullPath = path.join(polaroidDir, file.name);
          const stats = await fs.stat(fullPath);
          
          polaroidFiles.push({
            filename: file.name,
            playerName: this.extractPlayerName(file.name),
            fullPath,
            extension: path.extname(file.name),
            size: stats.size,
            lastModified: stats.mtime,
          });
        }
      }

      // Update cache
      this.polaroidCache.set('all', polaroidFiles);
      this.lastCacheUpdate = now;

      console.log(`Loaded ${polaroidFiles.length} polaroid images from /polaroids/`);
      return polaroidFiles;
    } catch (error) {
      console.error('Error loading polaroids:', error);
      return [];
    }
  }

  /**
   * Find polaroids for specific player names
   */
  static async findPolaroidsForPlayers(playerNames: string[]): Promise<PolaroidImage[]> {
    const availablePolaroids = await this.getAvailablePolaroids();
    const selectedPolaroids: PolaroidImage[] = [];

    for (const playerName of playerNames) {
      const matches = availablePolaroids.filter(polaroid =>
        this.matchesPlayerName(polaroid.playerName, playerName)
      );

      if (matches.length > 0) {
        // Select random polaroid if multiple available for same player
        const selected = matches[Math.floor(Math.random() * matches.length)];
        
        selectedPolaroids.push({
          filename: selected.filename,
          playerName: selected.playerName,
          rotation: this.generateRandomRotation(),
          position: 0, // Will be calculated based on text position
          altText: `${selected.playerName} - Transfer Juice`,
          source: 'manual', // From /polaroids/ folder
        });
      } else {
        // No polaroid found, could implement fallback logic here
        console.log(`No polaroid found for player: ${playerName}`);
      }
    }

    return selectedPolaroids;
  }

  /**
   * Generate optimized polaroid placements based on text content
   */
  static generatePlacements(
    content: string,
    polaroids: PolaroidImage[],
    scrollHeight: number = 1000
  ): PolaroidPlacement[] {
    const placements: PolaroidPlacement[] = [];
    const contentLines = content.split('\n');
    const lineHeight = 24; // Approximate line height in pixels
    
    // Find player mentions in content and calculate positions
    polaroids.forEach((polaroid, index) => {
      const playerMentions = this.findPlayerMentionsInContent(content, polaroid.playerName);
      
      if (playerMentions.length > 0) {
        // Use first mention for placement, could be enhanced for multiple mentions
        const firstMention = playerMentions[0];
        const scrollPosition = firstMention.lineNumber * lineHeight + (index * 120); // Offset for multiple images
        
        placements.push({
          image: {
            ...polaroid,
            position: scrollPosition,
          },
          scrollPosition,
          textSection: firstMention.section,
          visibility: 'hidden', // Initial state
        });
      }
    });

    // Sort by scroll position and add staggered offsets to prevent overlap
    placements.sort((a, b) => a.scrollPosition - b.scrollPosition);
    
    // Adjust positions to prevent overlap
    for (let i = 1; i < placements.length; i++) {
      const previous = placements[i - 1];
      const current = placements[i];
      const minDistance = 150; // Minimum pixels between images
      
      if (current.scrollPosition - previous.scrollPosition < minDistance) {
        current.scrollPosition = previous.scrollPosition + minDistance;
        current.image.position = current.scrollPosition;
      }
    }

    return placements;
  }

  /**
   * Get public URL for polaroid image
   */
  static getPolaroidUrl(filename: string): string {
    return `/polaroids/${filename}`;
  }

  /**
   * Generate random rotation within ±8 degrees
   */
  private static generateRandomRotation(): number {
    const min = -8;
    const max = 8;
    return Math.random() * (max - min) + min;
  }

  /**
   * Check if file is a supported image format
   */
  private static isImageFile(filename: string): boolean {
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const extension = path.extname(filename).toLowerCase();
    return supportedExtensions.includes(extension);
  }

  /**
   * Extract player name from filename
   * Supports formats: "haaland.jpg", "erling-haaland.png", "Kylian_Mbappe.webp"
   */
  private static extractPlayerName(filename: string): string {
    const nameWithoutExtension = path.parse(filename).name;
    
    // Replace underscores and hyphens with spaces, then title case
    return nameWithoutExtension
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Check if polaroid player name matches mentioned player
   */
  private static matchesPlayerName(polaroidName: string, mentionedName: string): boolean {
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');
    const normalizedPolaroid = normalize(polaroidName);
    const normalizedMention = normalize(mentionedName);

    // Exact match
    if (normalizedPolaroid === normalizedMention) return true;

    // Check if either name contains the other (for first/last name matches)
    if (normalizedPolaroid.includes(normalizedMention) || normalizedMention.includes(normalizedPolaroid)) {
      return true;
    }

    // Check individual words for partial matches
    const polaroidWords = polaroidName.toLowerCase().split(/\s+/);
    const mentionWords = mentionedName.toLowerCase().split(/\s+/);

    for (const pWord of polaroidWords) {
      for (const mWord of mentionWords) {
        if (pWord === mWord && pWord.length > 2) { // Avoid matching short words
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Find all mentions of a player in content with line numbers
   */
  private static findPlayerMentionsInContent(
    content: string,
    playerName: string
  ): Array<{ lineNumber: number; section: string; context: string }> {
    const mentions = [];
    const lines = content.split('\n');
    const normalizedPlayerName = playerName.toLowerCase();

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(normalizedPlayerName)) {
        // Determine section based on content or line position
        let section = 'main';
        if (index < lines.length * 0.25) section = 'lead';
        else if (index > lines.length * 0.75) section = 'bullshit_corner';
        else if (line.includes('Speaking of') || line.includes('remember')) section = 'context';

        mentions.push({
          lineNumber: index,
          section,
          context: line.substring(0, 100) + '...', // First 100 chars for context
        });
      }
    });

    return mentions;
  }

  /**
   * Validate polaroid directory and provide setup instructions
   */
  static async validateSetup(): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    try {
      const polaroids = await this.getAvailablePolaroids();
      
      if (polaroids.length === 0) {
        issues.push('No polaroid images found in /polaroids/ directory');
        suggestions.push('Add player images to public/polaroids/ folder');
        suggestions.push('Use format: player-name.jpg (e.g., erling-haaland.jpg)');
      } else if (polaroids.length < 5) {
        issues.push(`Only ${polaroids.length} polaroids found - recommend at least 10 for variety`);
        suggestions.push('Add more player images for better content coverage');
      }

      // Check for common players
      const commonPlayers = ['haaland', 'mbappe', 'bellingham', 'kane', 'salah'];
      const availableNames = polaroids.map(p => p.playerName.toLowerCase());
      const missingCommon = commonPlayers.filter(player => 
        !availableNames.some(name => name.includes(player))
      );

      if (missingCommon.length > 0) {
        suggestions.push(`Consider adding polaroids for: ${missingCommon.join(', ')}`);
      }

      return {
        isValid: issues.length === 0,
        issues,
        suggestions,
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Error accessing polaroids: ${error}`],
        suggestions: ['Check that public/polaroids/ directory exists and is readable'],
      };
    }
  }

  /**
   * Get statistics about available polaroids
   */
  static async getStats(): Promise<{
    totalPolaroids: number;
    uniquePlayers: number;
    averageFileSize: number;
    fileTypes: Record<string, number>;
    recentlyAdded: PolaroidFile[];
  }> {
    const polaroids = await this.getAvailablePolaroids();
    const fileTypes: Record<string, number> = {};
    let totalSize = 0;

    polaroids.forEach(polaroid => {
      const ext = polaroid.extension.toLowerCase();
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      totalSize += polaroid.size || 0;
    });

    const recentlyAdded = polaroids
      .filter(p => p.lastModified)
      .sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0))
      .slice(0, 5);

    return {
      totalPolaroids: polaroids.length,
      uniquePlayers: new Set(polaroids.map(p => p.playerName)).size,
      averageFileSize: polaroids.length > 0 ? totalSize / polaroids.length : 0,
      fileTypes,
      recentlyAdded,
    };
  }
}

// Export convenience functions
export const polaroidManager = {
  getAvailable: () => PolaroidManager.getAvailablePolaroids(),
  findForPlayers: (players: string[]) => PolaroidManager.findPolaroidsForPlayers(players),
  generatePlacements: (content: string, polaroids: PolaroidImage[]) => 
    PolaroidManager.generatePlacements(content, polaroids),
  getUrl: (filename: string) => PolaroidManager.getPolaroidUrl(filename),
  validate: () => PolaroidManager.validateSetup(),
  stats: () => PolaroidManager.getStats(),
};