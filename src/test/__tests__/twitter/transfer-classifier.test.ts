/**
 * Transfer Classifier Tests
 * Testing AI-powered transfer tweet classification
 */

import { transferKeywordClassifier } from '@/lib/twitter/transfer-classifier';

describe('TransferClassifier', () => {
  describe('Tweet Classification', () => {
    it('should classify confirmed transfer tweets with high confidence', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Arsenal have officially signed Declan Rice from West Ham for £105m. Done deal! Welcome to Arsenal! 🔴 #AFC',
        authorTier: 'tier1',
        authorSpecialties: ['Arsenal', 'Premier League'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.transferType).toBe('CONFIRMED');
      expect(result.keywords).toContain('signed');
      expect(result.keywords).toContain('done deal');
      expect(result.reasonCode).toBe('high_confidence');
    });

    it('should classify medical stage tweets correctly', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Kai Havertz will undergo his medical at Arsenal tomorrow morning before completing his move from Chelsea.',
        authorTier: 'tier1',
        authorSpecialties: ['Arsenal', 'Chelsea'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.transferType).toBe('MEDICAL');
      expect(result.keywords).toContain('medical');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should classify advanced talks appropriately', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Manchester United are in advanced negotiations with Barcelona for Frenkie de Jong. Personal terms nearly agreed.',
        authorTier: 'tier2',
        authorSpecialties: ['Manchester United'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.transferType).toBe('ADVANCED');
      expect(result.keywords).toContain('advanced negotiations');
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    it('should classify early stage talks with medium confidence', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Liverpool are reportedly interested in Brighton midfielder Alexis Mac Allister according to sources.',
        authorTier: 'tier2',
        authorSpecialties: ['Liverpool'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.transferType).toBe('RUMOUR');
      expect(result.keywords).toContain('interested in');
      expect(result.keywords).toContain('reportedly');
    });

    it('should classify rumours with lower confidence', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Speculation suggests that Tottenham could be monitoring Napoli striker Victor Osimhen this summer.',
        authorTier: 'tier3',
        authorSpecialties: ['Tottenham'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.transferType).toBe('RUMOUR');
      expect(result.keywords).toContain('speculation');
      expect(result.keywords).toContain('monitoring');
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should reject non-transfer football content', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'What a goal by Arsenal! Brilliant team play leads to a stunning finish. Great performance today!',
        authorTier: 'tier1',
        authorSpecialties: ['Arsenal'],
      });

      expect(result.isTransferRelated).toBe(false);
      expect(result.confidence).toBeLessThan(0.4);
      expect(result.transferType).toBeUndefined();
      expect(result.reasonCode).toBe('low_confidence');
    });

    it('should reject completely unrelated content', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Just had an amazing coffee this morning. Perfect way to start the day! ☕️',
        authorTier: 'tier2',
        authorSpecialties: [],
      });

      expect(result.isTransferRelated).toBe(false);
      expect(result.confidence).toBeLessThan(0.2);
      expect(result.keywords).toHaveLength(0);
    });

    it('should boost confidence for tier 1 sources', async () => {
      const tier1Result = await transferKeywordClassifier.classifyTweet({
        text: 'Chelsea are in talks to sign a new striker.',
        authorTier: 'tier1',
        authorSpecialties: ['Chelsea'],
      });

      const tier3Result = await transferKeywordClassifier.classifyTweet({
        text: 'Chelsea are in talks to sign a new striker.',
        authorTier: 'tier3',
        authorSpecialties: ['Chelsea'],
      });

      expect(tier1Result.confidence).toBeGreaterThan(tier3Result.confidence);
    });

    it('should detect financial information correctly', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Manchester City agree £100m fee for Jack Grealish from Aston Villa. Record signing!',
        authorTier: 'tier1',
        authorSpecialties: ['Manchester City'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.keywords).toContain('£100m');
      expect(result.keywords).toContain('fee');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect multiple club mentions', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Liverpool and Chelsea both want Brighton midfielder Moises Caicedo this summer.',
        authorTier: 'tier2',
        authorSpecialties: ['Premier League'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.keywords).toContain('multiple_clubs');
      expect(result.confidence).toBeGreaterThan(0.4);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract clubs correctly', async () => {
      const result = await transferKeywordClassifier.extractEntities(
        'Arsenal and Chelsea are both interested in Brighton defender Lewis Dunk.'
      );

      expect(result.clubs).toContain('Arsenal');
      expect(result.clubs).toContain('Chelsea');
      expect(result.clubs).toContain('Brighton');
    });

    it('should extract player positions', async () => {
      const result = await transferKeywordClassifier.extractEntities(
        'Liverpool are looking for a new striker and defensive midfielder for next season.'
      );

      expect(result.positions).toContain('striker');
      expect(result.positions).toContain('defensive midfielder');
    });

    it('should extract fee amounts', async () => {
      const result = await transferKeywordClassifier.extractEntities(
        'The transfer fee is £80m plus £20m in add-ons, totaling 100 million pounds.'
      );

      expect(result.fees).toContain('£80m');
      expect(result.fees).toContain('£20m');
      expect(result.fees).toContain('100 million');
    });

    it('should extract potential player names', async () => {
      const result = await transferKeywordClassifier.extractEntities(
        'Declan Rice and Moises Caicedo are both targets for Arsenal this summer.'
      );

      expect(result.players).toContain('Declan Rice');
      expect(result.players).toContain('Moises Caicedo');
    });

    it('should extract agent mentions', async () => {
      const result = await transferKeywordClassifier.extractEntities(
        "The player's agent is in London to negotiate personal terms with the club."
      );

      expect(result.agents).toContain('agent');
    });

    it('should handle empty text gracefully', async () => {
      const result = await transferKeywordClassifier.extractEntities('');

      expect(result.players).toHaveLength(0);
      expect(result.clubs).toHaveLength(0);
      expect(result.positions).toHaveLength(0);
      expect(result.agents).toHaveLength(0);
      expect(result.fees).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long tweets', async () => {
      const longTweet =
        'Arsenal are reportedly interested in signing '.repeat(20) +
        'a new midfielder from Barcelona according to multiple sources.';

      const result = await transferKeywordClassifier.classifyTweet({
        text: longTweet,
        authorTier: 'tier2',
        authorSpecialties: ['Arsenal'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle tweets with lots of emojis and special characters', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: '🚨🔴 CONFIRMED! Arsenal have signed Kai Havertz! 💰💰💰 £65m deal! Welcome to Arsenal! 🎉🎉🎉 #AFC #Gunners',
        authorTier: 'tier1',
        authorSpecialties: ['Arsenal'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.transferType).toBe('CONFIRMED');
    });

    it('should handle case insensitive matching', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'ARSENAL HAVE OFFICIALLY SIGNED A NEW STRIKER FROM BAYERN MUNICH!',
        authorTier: 'tier1',
        authorSpecialties: ['Arsenal'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.keywords).toContain('signed');
    });

    it('should handle tweets with URLs and mentions', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: '@Arsenal have confirmed the signing of @DeclanRice. More details: https://arsenal.com/news #AFC',
        authorTier: 'tier1',
        authorSpecialties: ['Arsenal'],
      });

      expect(result.isTransferRelated).toBe(true);
      expect(result.keywords).toContain('signed');
    });
  });

  describe('Classification Statistics', () => {
    it('should provide classification stats', () => {
      const stats = transferKeywordClassifier.getClassificationStats();

      expect(stats.totalKeywords).toBeGreaterThan(0);
      expect(stats.totalClubs).toBeGreaterThan(0);
      expect(stats.totalPositions).toBeGreaterThan(0);
      expect(typeof stats.totalKeywords).toBe('number');
      expect(typeof stats.totalClubs).toBe('number');
      expect(typeof stats.totalPositions).toBe('number');
    });
  });

  describe('Context Annotations', () => {
    it('should use Twitter context annotations when available', async () => {
      const result = await transferKeywordClassifier.classifyTweet({
        text: 'Big news coming soon...',
        contextAnnotations: [
          {
            domain: { id: '11', name: 'Sport' },
            entity: { id: '12', name: 'Football' },
          },
          {
            domain: { id: '13', name: 'Sports Team' },
            entity: { id: '14', name: 'Arsenal FC' },
          },
        ],
        authorTier: 'tier1',
        authorSpecialities: ['Arsenal'],
      });

      // Even vague text should get some boost from context
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
