/**
 * Global ITK Sources Tests
 * Validates that we have 20+ sources covering 5 major leagues
 */

import {
  ALL_ITK_SOURCES,
  TIER_1_SOURCES,
  TIER_2_SOURCES,
  TIER_2_ADDITIONAL,
  TIER_3_SOURCES,
  getSourcesByRegion,
  getSourcesByTier,
  getSourcesByLanguage,
  getActiveSources,
  getMonitoringPriority,
  type ITKSource,
} from "../globalSources";

describe("Global ITK Sources Configuration", () => {
  describe("Source Count Requirements", () => {
    it("should have 20+ global ITK sources", () => {
      expect(ALL_ITK_SOURCES.length).toBeGreaterThanOrEqual(20);

      console.log(`Total ITK Sources: ${ALL_ITK_SOURCES.length}`);
      console.log(`Breakdown:`);
      console.log(`  Tier 1: ${TIER_1_SOURCES.length} sources`);
      console.log(`  Tier 2: ${TIER_2_SOURCES.length} sources`);
      console.log(`  Tier 2 Additional: ${TIER_2_ADDITIONAL.length} sources`);
      console.log(`  Tier 3: ${TIER_3_SOURCES.length} sources`);
    });

    it("should have all sources active by default", () => {
      const activeSources = getActiveSources();
      expect(activeSources.length).toBe(ALL_ITK_SOURCES.length);
      expect(activeSources.length).toBeGreaterThanOrEqual(20);
    });

    it("should have proper tier distribution", () => {
      const tier1 = getSourcesByTier(1);
      const tier2 = getSourcesByTier(2);
      const tier3 = getSourcesByTier(3);

      expect(tier1.length).toBeGreaterThanOrEqual(3); // Elite sources
      expect(tier2.length).toBeGreaterThanOrEqual(5); // Trusted sources
      expect(tier3.length).toBeGreaterThanOrEqual(8); // Regional sources

      expect(tier1.length + tier2.length + tier3.length).toBe(
        ALL_ITK_SOURCES.length,
      );
    });
  });

  describe("Regional Coverage Requirements", () => {
    it("should cover 5 major leagues regions", () => {
      const regions = [...new Set(ALL_ITK_SOURCES.map((s) => s.region))];

      // Should include major regions
      expect(regions).toContain("UK"); // Premier League
      expect(regions).toContain("ES"); // La Liga
      expect(regions).toContain("IT"); // Serie A
      expect(regions).toContain("FR"); // Ligue 1
      expect(regions).toContain("DE"); // Bundesliga
      expect(regions).toContain("BR"); // Brazilian sources
      expect(regions).toContain("GLOBAL"); // Global sources

      console.log(`Regions covered: ${regions.join(", ")}`);
      console.log(`Total regions: ${regions.length}`);
    });

    it("should have sources for each major region", () => {
      const ukSources = getSourcesByRegion("UK");
      const esSources = getSourcesByRegion("ES");
      const itSources = getSourcesByRegion("IT");
      const frSources = getSourcesByRegion("FR");
      const deSources = getSourcesByRegion("DE");
      const globalSources = getSourcesByRegion("GLOBAL");

      expect(ukSources.length).toBeGreaterThanOrEqual(2);
      expect(esSources.length).toBeGreaterThanOrEqual(2);
      expect(itSources.length).toBeGreaterThanOrEqual(2);
      expect(frSources.length).toBeGreaterThanOrEqual(2);
      expect(deSources.length).toBeGreaterThanOrEqual(2);
      expect(globalSources.length).toBeGreaterThanOrEqual(2);

      console.log(`Regional distribution:`);
      console.log(`  UK: ${ukSources.length} sources`);
      console.log(`  ES: ${esSources.length} sources`);
      console.log(`  IT: ${itSources.length} sources`);
      console.log(`  FR: ${frSources.length} sources`);
      console.log(`  DE: ${deSources.length} sources`);
      console.log(`  GLOBAL: ${globalSources.length} sources`);
    });

    it("should support major league coverage", () => {
      const leagueCoverage = ALL_ITK_SOURCES.reduce(
        (acc, source) => {
          source.leagues.forEach((league) => {
            acc[league] = (acc[league] || 0) + 1;
          });
          return acc;
        },
        {} as Record<string, number>,
      );

      // Major leagues should have multiple sources
      expect(leagueCoverage["PL"]).toBeGreaterThanOrEqual(5);
      expect(leagueCoverage["LaLiga"]).toBeGreaterThanOrEqual(3);
      expect(leagueCoverage["SerieA"]).toBeGreaterThanOrEqual(3);
      expect(leagueCoverage["Bundesliga"]).toBeGreaterThanOrEqual(3);
      expect(leagueCoverage["Ligue1"]).toBeGreaterThanOrEqual(3);

      console.log(`League coverage:`, leagueCoverage);
    });
  });

  describe("Language Support Requirements", () => {
    it("should support multiple languages", () => {
      const languages = [...new Set(ALL_ITK_SOURCES.map((s) => s.language))];

      expect(languages).toContain("en"); // English
      expect(languages).toContain("es"); // Spanish
      expect(languages).toContain("it"); // Italian
      expect(languages).toContain("fr"); // French
      expect(languages).toContain("de"); // German
      expect(languages).toContain("pt"); // Portuguese

      console.log(`Languages supported: ${languages.join(", ")}`);
    });

    it("should have balanced language distribution", () => {
      const enSources = getSourcesByLanguage("en");
      const esSources = getSourcesByLanguage("es");
      const itSources = getSourcesByLanguage("it");
      const frSources = getSourcesByLanguage("fr");
      const deSources = getSourcesByLanguage("de");
      const ptSources = getSourcesByLanguage("pt");

      expect(enSources.length).toBeGreaterThanOrEqual(6); // English dominant
      expect(esSources.length).toBeGreaterThanOrEqual(2);
      expect(itSources.length).toBeGreaterThanOrEqual(2);
      expect(frSources.length).toBeGreaterThanOrEqual(2);
      expect(deSources.length).toBeGreaterThanOrEqual(2);
      expect(ptSources.length).toBeGreaterThanOrEqual(1);

      console.log(`Language distribution:`);
      console.log(`  English: ${enSources.length} sources`);
      console.log(`  Spanish: ${esSources.length} sources`);
      console.log(`  Italian: ${itSources.length} sources`);
      console.log(`  French: ${frSources.length} sources`);
      console.log(`  German: ${deSources.length} sources`);
      console.log(`  Portuguese: ${ptSources.length} sources`);
    });
  });

  describe("Source Quality Requirements", () => {
    it("should have high reliability scores", () => {
      const tier1Reliability = TIER_1_SOURCES.every(
        (s) => s.reliability >= 0.9,
      );
      const tier2Reliability = [...TIER_2_SOURCES, ...TIER_2_ADDITIONAL].every(
        (s) => s.reliability >= 0.75,
      );
      const tier3Reliability = TIER_3_SOURCES.every(
        (s) => s.reliability >= 0.7,
      );

      expect(tier1Reliability).toBe(true);
      expect(tier2Reliability).toBe(true);
      expect(tier3Reliability).toBe(true);

      const avgReliability =
        ALL_ITK_SOURCES.reduce((sum, s) => sum + s.reliability, 0) /
        ALL_ITK_SOURCES.length;
      expect(avgReliability).toBeGreaterThan(0.75);

      console.log(`Average reliability: ${(avgReliability * 100).toFixed(1)}%`);
    });

    it("should have proper monitoring priority order", () => {
      const prioritySources = getMonitoringPriority();

      expect(prioritySources.length).toBe(ALL_ITK_SOURCES.length);

      // First sources should be Tier 1
      const firstFew = prioritySources.slice(0, 3);
      expect(firstFew.every((s) => s.tier === 1)).toBe(true);

      // Should be ordered by tier first, then reliability
      for (let i = 0; i < prioritySources.length - 1; i++) {
        const current = prioritySources[i];
        const next = prioritySources[i + 1];

        if (current.tier === next.tier) {
          expect(current.reliability).toBeGreaterThanOrEqual(next.reliability);
        } else {
          expect(current.tier).toBeLessThan(next.tier);
        }
      }

      console.log("Top 5 priority sources:");
      prioritySources.slice(0, 5).forEach((source, index) => {
        console.log(
          `  ${index + 1}. ${source.name} (Tier ${source.tier}, ${(source.reliability * 100).toFixed(1)}%)`,
        );
      });
    });
  });

  describe("Source Data Validation", () => {
    it("should have all required fields for each source", () => {
      ALL_ITK_SOURCES.forEach((source) => {
        expect(source.id).toBeTruthy();
        expect(source.name).toBeTruthy();
        expect(source.handle).toMatch(/^@\w+/);
        expect([1, 2, 3]).toContain(source.tier);
        expect(source.reliability).toBeGreaterThan(0);
        expect(source.reliability).toBeLessThanOrEqual(1);
        expect(["UK", "ES", "IT", "FR", "DE", "BR", "GLOBAL"]).toContain(
          source.region,
        );
        expect(["en", "es", "it", "fr", "de", "pt"]).toContain(source.language);
        expect(Array.isArray(source.specialties)).toBe(true);
        expect(Array.isArray(source.leagues)).toBe(true);
        expect(typeof source.isActive).toBe("boolean");
      });
    });

    it("should have unique IDs and handles", () => {
      const ids = ALL_ITK_SOURCES.map((s) => s.id);
      const handles = ALL_ITK_SOURCES.map((s) => s.handle);

      expect(new Set(ids).size).toBe(ALL_ITK_SOURCES.length);
      expect(new Set(handles).size).toBe(ALL_ITK_SOURCES.length);
    });

    it("should have proper league assignments", () => {
      const validLeagues = [
        "PL",
        "LaLiga",
        "SerieA",
        "Bundesliga",
        "Ligue1",
        "UCL",
        "Championship",
        "Brasileirao",
      ];

      ALL_ITK_SOURCES.forEach((source) => {
        expect(source.leagues.length).toBeGreaterThan(0);
        source.leagues.forEach((league) => {
          expect(validLeagues).toContain(league);
        });
      });
    });
  });

  describe("Elite Sources (Tier 1)", () => {
    it("should include global transfer experts", () => {
      const sourceNames = TIER_1_SOURCES.map((s) => s.name.toLowerCase());

      expect(sourceNames).toContain("fabrizio romano");
      expect(sourceNames).toContain("david ornstein");
      expect(sourceNames).toContain("gianluca di marzio");

      // All Tier 1 should have >90% reliability
      TIER_1_SOURCES.forEach((source) => {
        expect(source.reliability).toBeGreaterThan(0.9);
      });
    });
  });

  describe("Global Coverage Analysis", () => {
    it("should provide comprehensive global coverage", () => {
      // Test data for comprehensive analysis
      const stats = {
        totalSources: ALL_ITK_SOURCES.length,
        activeSources: getActiveSources().length,
        regions: [...new Set(ALL_ITK_SOURCES.map((s) => s.region))].length,
        languages: [...new Set(ALL_ITK_SOURCES.map((s) => s.language))].length,
        leagues: [...new Set(ALL_ITK_SOURCES.flatMap((s) => s.leagues))].length,
        avgReliability:
          ALL_ITK_SOURCES.reduce((sum, s) => sum + s.reliability, 0) /
          ALL_ITK_SOURCES.length,
      };

      expect(stats.totalSources).toBeGreaterThanOrEqual(20);
      expect(stats.regions).toBeGreaterThanOrEqual(6);
      expect(stats.languages).toBeGreaterThanOrEqual(5);
      expect(stats.leagues).toBeGreaterThanOrEqual(6);
      expect(stats.avgReliability).toBeGreaterThan(0.75);

      console.log("📊 Global ITK Coverage Analysis:");
      console.log(
        `  ✅ Total Sources: ${stats.totalSources} (requirement: 20+)`,
      );
      console.log(`  ✅ Active Sources: ${stats.activeSources}`);
      console.log(`  ✅ Regions Covered: ${stats.regions}`);
      console.log(`  ✅ Languages Supported: ${stats.languages}`);
      console.log(`  ✅ Leagues Monitored: ${stats.leagues}`);
      console.log(
        `  ✅ Average Reliability: ${(stats.avgReliability * 100).toFixed(1)}%`,
      );
    });
  });
});
