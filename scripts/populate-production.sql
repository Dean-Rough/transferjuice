-- Create source if not exists
INSERT INTO itk_sources (id, username, name, type, region, "isReliable", reliability, language, specialties, leagues, "createdAt", "updatedAt")
VALUES (
  'transferjuice-live-source',
  'transferjuice-live',
  'Transfer Juice Live Updates',
  'MANUAL',
  'GLOBAL',
  true,
  1.0,
  'en',
  ARRAY['transfers', 'breaking-news', 'exclusives'],
  ARRAY['PREMIER_LEAGUE', 'LA_LIGA', 'SERIE_A', 'BUNDESLIGA', 'LIGUE_1']::text[],
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET "updatedAt" = NOW()
RETURNING id;

-- Clear existing feed items for this source
DELETE FROM feed_items WHERE "sourceId" = 'transferjuice-live-source';

-- Insert new feed items
INSERT INTO feed_items (id, headline, content, "sourceId", type, league, "isRelevant", confidence, "rawContent", "extractedAt", "createdAt", "updatedAt")
VALUES 
  (
    gen_random_uuid(),
    'BREAKING: Man City Submit €100m Bid for Florian Wirtz',
    'Manchester City have submitted a €100 million bid for Bayer Leverkusen midfielder Florian Wirtz. The German international is Pep Guardiola''s top target to replace Kevin De Bruyne. Leverkusen are reluctant to sell but the massive offer is being considered. Personal terms won''t be an issue as City offer €400k per week.',
    'transferjuice-live-source',
    'EXCLUSIVE',
    'BUNDESLIGA',
    true,
    0.92,
    '{"verified": true}'::jsonb,
    NOW() - INTERVAL '30 minutes',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Liverpool Close to Signing Khvicha Kvaratskhelia for £85m',
    'Liverpool are in advanced talks with Napoli over an £85 million deal for Georgian winger Khvicha Kvaratskhelia. The 23-year-old has agreed personal terms worth £250k per week. Medical scheduled for this weekend if clubs can finalize payment structure. Napoli want majority upfront.',
    'transferjuice-live-source',
    'DEVELOPING',
    'SERIE_A',
    true,
    0.88,
    '{"stage": "advanced negotiations"}'::jsonb,
    NOW() - INTERVAL '45 minutes',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Real Madrid Agree €70m Deal for Leny Yoro',
    'Real Madrid have reached an agreement with Lille for defender Leny Yoro. Transfer fee set at €70m plus €10m in add-ons. The 18-year-old French centre-back will sign a 6-year contract. Manchester United were also interested but player chose Madrid. Medical next week.',
    'transferjuice-live-source',
    'CONFIRMED',
    'LIGUE_1',
    true,
    0.95,
    '{"fee": "€70m+10m"}'::jsonb,
    NOW() - INTERVAL '1 hour',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Chelsea Preparing £90m Bid for Victor Osimhen',
    'Chelsea are preparing a £90 million bid for Napoli striker Victor Osimhen. The Nigerian international is keen on Premier League move. Chelsea offering 7-year contract worth £300k per week. Napoli holding out for £110m but may accept structured deal. Lukaku could go opposite direction.',
    'transferjuice-live-source',
    'SPECULATION',
    'SERIE_A',
    true,
    0.75,
    '{"player_interest": "keen"}'::jsonb,
    NOW() - INTERVAL '90 minutes',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Arsenal Sign Mikel Merino from Real Sociedad',
    'DONE DEAL: Arsenal have completed the signing of Mikel Merino from Real Sociedad for €35 million. The Spanish midfielder has signed a 4-year contract with option for additional year. He''ll wear number 23 shirt. Adds crucial depth to Arteta''s midfield options.',
    'transferjuice-live-source',
    'CONFIRMED',
    'LA_LIGA',
    true,
    1.0,
    '{"official": true}'::jsonb,
    NOW() - INTERVAL '2 hours',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Bayern Munich Open Talks for João Palhinha',
    'Bayern Munich have reopened negotiations with Fulham for João Palhinha. Initial €45m bid submitted. Portuguese midfielder keen to join after failed move last summer. Fulham want €60m but deal expected to be reached. Vincent Kompany sees him as key signing.',
    'transferjuice-live-source',
    'DEVELOPING',
    'PREMIER_LEAGUE',
    true,
    0.82,
    '{"bid": "€45m"}'::jsonb,
    NOW() - INTERVAL '150 minutes',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'PSG Launch €120m Bid for Bukayo Saka',
    'Paris Saint-Germain have made a shock €120 million bid for Arsenal winger Bukayo Saka. The French champions see him as Mbappé replacement. Arsenal expected to reject immediately - Saka is not for sale. Player happy at Arsenal but PSG offering to triple his wages.',
    'transferjuice-live-source',
    'RUMOUR',
    'LIGUE_1',
    true,
    0.65,
    '{"shock_factor": "high"}'::jsonb,
    NOW() - INTERVAL '3 hours',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Juventus Close to Signing Jadon Sancho on Loan',
    'Juventus are finalizing a loan deal for Manchester United winger Jadon Sancho. Deal includes €8m loan fee with option to buy for €40m. United pushing for obligation to buy. Sancho eager for fresh start in Serie A. Personal terms agreed. Could be announced within 48 hours.',
    'transferjuice-live-source',
    'DEVELOPING',
    'SERIE_A',
    true,
    0.85,
    '{"structure": "loan with option"}'::jsonb,
    NOW() - INTERVAL '200 minutes',
    NOW(),
    NOW()
  );

-- Check what we inserted
SELECT COUNT(*) as feed_item_count FROM feed_items WHERE "sourceId" = 'transferjuice-live-source';