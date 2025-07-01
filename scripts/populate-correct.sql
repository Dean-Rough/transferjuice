-- Create source if not exists
INSERT INTO itk_sources (id, username, name, tier, reliability, region, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES (
  'transferjuice-live-source',
  'transferjuice-live',
  'Transfer Juice Live Updates',
  1,
  1.0,
  'GLOBAL',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET "updatedAt" = NOW();

-- Clear existing feed items for this source
DELETE FROM feed_items WHERE "sourceId" = 'transferjuice-live-source';

-- Insert new feed items with correct schema
INSERT INTO feed_items (
  id, 
  type, 
  content, 
  "terryCommentary",
  "sourceId", 
  "transferType", 
  priority,
  "relevanceScore",
  league, 
  "publishedAt",
  "createdAt", 
  "updatedAt"
)
VALUES 
  (
    'fi-' || gen_random_uuid()::text,
    'ITK',
    'BREAKING: Man City Submit €100m Bid for Florian Wirtz - Manchester City have submitted a €100 million bid for Bayer Leverkusen midfielder Florian Wirtz. The German international is Pep Guardiola''s top target to replace Kevin De Bruyne. Leverkusen are reluctant to sell but the massive offer is being considered.',
    'Right, so City''s solution to an aging De Bruyne is to throw stupid money at a 21-year-old. Because that always works out brilliantly.',
    'transferjuice-live-source',
    'TRANSFER',
    'HIGH',
    0.92,
    'BUNDESLIGA',
    NOW() - INTERVAL '30 minutes',
    NOW(),
    NOW()
  ),
  (
    'fi-' || gen_random_uuid()::text,
    'ITK',
    'Liverpool Close to Signing Khvicha Kvaratskhelia for £85m - Liverpool are in advanced talks with Napoli over an £85 million deal for Georgian winger Khvicha Kvaratskhelia. The 23-year-old has agreed personal terms worth £250k per week. Medical scheduled for this weekend.',
    'Liverpool splashing cash like they''ve found Klopp''s secret stash. £85m for a winger when they need defenders? Classic.',
    'transferjuice-live-source',
    'TRANSFER',
    'HIGH',
    0.88,
    'SERIE_A',
    NOW() - INTERVAL '45 minutes',
    NOW(),
    NOW()
  ),
  (
    'fi-' || gen_random_uuid()::text,
    'ITK',
    'Real Madrid Agree €70m Deal for Leny Yoro - Real Madrid have reached an agreement with Lille for defender Leny Yoro. Transfer fee set at €70m plus €10m in add-ons. The 18-year-old French centre-back will sign a 6-year contract.',
    'Madrid hoovering up another wonderkid before anyone else gets a sniff. Death, taxes, and Real Madrid signing French teenagers.',
    'transferjuice-live-source',
    'TRANSFER',
    'VERY_HIGH',
    0.95,
    'LIGUE_1',
    NOW() - INTERVAL '1 hour',
    NOW(),
    NOW()
  ),
  (
    'fi-' || gen_random_uuid()::text,
    'ITK',
    'Chelsea Preparing £90m Bid for Victor Osimhen - Chelsea are preparing a £90 million bid for Napoli striker Victor Osimhen. The Nigerian international is keen on Premier League move. Lukaku could go opposite direction.',
    'Chelsea''s striker graveyard preparing for another victim. At least Lukaku might finally escape.',
    'transferjuice-live-source',
    'TRANSFER',
    'MEDIUM',
    0.75,
    'SERIE_A',
    NOW() - INTERVAL '90 minutes',
    NOW(),
    NOW()
  ),
  (
    'fi-' || gen_random_uuid()::text,
    'ITK',
    'DONE DEAL: Arsenal Sign Mikel Merino from Real Sociedad - Arsenal have completed the signing of Mikel Merino from Real Sociedad for €35 million. The Spanish midfielder has signed a 4-year contract.',
    'Arsenal actually completing a signing without 47 rounds of negotiations. Arteta''s getting efficient in his old age.',
    'transferjuice-live-source',
    'DONE_DEAL',
    'VERY_HIGH',
    1.0,
    'LA_LIGA',
    NOW() - INTERVAL '2 hours',
    NOW(),
    NOW()
  ),
  (
    'fi-' || gen_random_uuid()::text,
    'ITK',
    'Bayern Munich Open Talks for João Palhinha - Bayern Munich have reopened negotiations with Fulham for João Palhinha. Initial €45m bid submitted. Portuguese midfielder keen to join after failed move last summer.',
    'Bayern back for round two after last summer''s medical drama. Someone check if Fulham''s fax machine is working this time.',
    'transferjuice-live-source',
    'TRANSFER',
    'MEDIUM',
    0.82,
    'PREMIER_LEAGUE',
    NOW() - INTERVAL '150 minutes',
    NOW(),
    NOW()
  ),
  (
    'fi-' || gen_random_uuid()::text,
    'ITK',
    'PSG Launch €120m Bid for Bukayo Saka - Paris Saint-Germain have made a shock €120 million bid for Arsenal winger Bukayo Saka. Arsenal expected to reject immediately.',
    'PSG with their annual ''throw money at Arsenal'' bid. File this under ''things that will never happen'' along with Spurs winning the league.',
    'transferjuice-live-source',
    'TRANSFER',
    'LOW',
    0.65,
    'LIGUE_1',
    NOW() - INTERVAL '3 hours',
    NOW(),
    NOW()
  ),
  (
    'fi-' || gen_random_uuid()::text,
    'ITK',
    'Juventus Close to Signing Jadon Sancho on Loan - Juventus are finalizing a loan deal for Manchester United winger Jadon Sancho. Deal includes €8m loan fee with option to buy for €40m.',
    'Sancho''s grand tour of Europe continues. At this rate he''ll have more loan clubs than goals.',
    'transferjuice-live-source',
    'LOAN',
    'HIGH',
    0.85,
    'SERIE_A',
    NOW() - INTERVAL '200 minutes',
    NOW(),
    NOW()
  );

-- Verify the data
SELECT COUNT(*) as feed_item_count FROM feed_items WHERE "sourceId" = 'transferjuice-live-source';

-- Show sample
SELECT content, "terryCommentary", league, priority FROM feed_items WHERE "sourceId" = 'transferjuice-live-source' LIMIT 3;