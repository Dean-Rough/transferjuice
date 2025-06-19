# Product Requirements Document (PRD)

**Project Name:** Transfer Juice — Premier League ITK Transfer Digest

**Website:** transferjuice.com

**Owner:** Dean

**Date:** June 18, 2025

---

## Overview

Transfer Juice is a fully automated football transfer newsletter and web digest that transforms the chaotic world of Premier League ITK (In The Know) Twitter into entertaining, readable content. The system monitors trusted sources three times daily, processes their tweets through AI with a distinctly ascerbic and witty voice, and delivers polished editorial-style briefings via email and a sleek dark-mode web interface.

**App Strapline:** _"All of the ITK rumours, for people who swear they're not obsessed with transfers."_

---

## Goals

- **Transform Transfer Twitter Chaos** - Convert unreliable ITK Twitter noise into genuinely engaging, entertaining content
- **Deliver Editorial Excellence** - Provide ascerbic, witty Premier League transfer summaries in the style of Joel Golby
- **Automate Premium Content Creation** - Fully automated pipeline from source monitoring to distribution
- **Build Engaged Audience** - Tri-daily email digests with growing subscriber base
- **Create Content Archive** - Responsive web archive with dark-mode aesthetic and monetization potential

---

## Content Strategy & Voice

### Editorial Voice

- **Ascerbic and Witty** - Sharp, sardonic observations about transfer absurdity
- **Joel Golby Style** - Engaging conversational tone with proper British humor
- **Entertaining Commentary** - Transform unreliable rumors into genuinely readable content
- **Editorial Flow** - Cohesive articles that make sense of Twitter chaos, not bullet points

### Content Structure

- **Morning Brief** (08:00 BST) - Overnight developments and absurdity
- **Afternoon Brief** (14:00 BST) - Midday madness and emerging stories
- **Evening Brief** (20:00 BST) - End-of-day roundup and weekend prep

---

## Design & Brand Guidelines

### Typography

- **Headers:** Geist 900 weight (bold, impactful)
- **Body Text:** Geist 100 weight (clean, readable)
- **Tags/Metadata:** Geist Mono (technical, distinctive)

### Color Palette

- **Primary Background:** #0A0808 (rich black)
- **Text:** #FFFFFF (pure white for readability)
- **Accent:** #F9F2DF (cream for warmth and highlights)
- **Vibrant Touches:** Orange/yellow gradient (#F2491F, #F65617, #FF8E21, #FFB905) for CTAs and energy

### Brand Assets

- Logo variants: black, white, cream (located in `/brand/`)
- Transfer icon for favicon and small applications
- Dark mode throughout all interfaces

### UI/UX Principles

- **Dark Mode First** - Black backgrounds with white text
- **Scattered Images** - Contextual placement, not rigid grid
- **Medium/Substack Style** - Clean, readable article presentation
- **Minimalist Navigation** - Focus on content consumption

---

## Technical Features

### 1. Source Monitoring

- **ITK Accounts** - Monitor 10 verified trusted sources:
  - Fabrizio Romano (@FabrizioRomano) - Official handle confirmed
  - David Ornstein (@David_Ornstein) - BBC Sport journalist
  - Sam Lee (@SamLee) - Verified via X profile
  - Paul Joyce (@\_pauljoyce) - The Times journalist
  - Laurie Whitwell (@lauriewhitwell) - The Athletic journalist
  - Rob Dawson (@RobDawsonESPN) - ESPN journalist
  - Luke Edwards (@LukeEdwardsTele) - Telegraph journalist
  - John Percy (@JPercyTelegraph) - Telegraph journalist
  - Craig Hope (@CraigHope_DM) - Daily Mail journalist
  - Dean Jones (@DeanJonesSoccer) - Football journalist
- **API Integration** - X (Twitter) API v2 with Bearer Token authentication
- **Frequency** - Query every 3-4 hours for comprehensive coverage
- **Data Storage** - Tweet content, timestamp, media URLs, original links

### 2. Content Processing & AI

- **Transfer Filtering** - Keyword matching for relevance ("signing", "fee", "medical", "contract", "bid")
- **AI Processing** - GPT-4/Claude with custom prompts for Joel Golby voice
- **Editorial Generation** - Transform filtered tweets into flowing, entertaining articles
- **Context Awareness** - Maintain narrative consistency across briefings

### 3. Image Integration

- **Source Priority** - Tweet media first, then Wikipedia Commons API
- **Contextual Placement** - Images scattered throughout articles for visual interest
- **Player/Club Assets** - Wikipedia Commons for professional headshots and club images
- **Fallback System** - Preview thumbnails when primary media unavailable

### 4. Web Interface (transferjuice.com)

- **Next.js Architecture** - App router with TypeScript and TailwindCSS
- **Public Archive** - /morning, /afternoon, /evening with chronological browsing
- **Newsletter Signup** - Prominent but non-intrusive subscription component
- **Responsive Design** - Mobile-first with desktop optimization
- **Search Functionality** - Find past briefings and specific transfer stories
- **Domain** - Hosted at transferjuice.com with proper DNS configuration

### 5. Email Distribution

- **HTML Templates** - Dark mode aesthetic matching web interface
- **Service Integration** - ConvertKit, MailerLite, or Postmark
- **Subscriber Management** - Sign-up, unsubscribe, and preference handling
- **Subject Line Wit** - Joel Golby voice extends to email subjects

### 6. Automation & Scheduling

- **Cron Jobs** - Automated triggers at 08:00, 14:00, 20:00 BST
- **Pipeline** - Fetch → Filter → Process → Format → Distribute
- **Error Handling** - Robust fallbacks and logging for <5% failure rate
- **Monitoring** - Performance tracking and alert system

---

## Technical Architecture

### Database Schema

- **Tweets** - Raw content, metadata, processing status
- **Articles** - Generated briefings with versioning
- **Subscribers** - Email list management
- **Analytics** - Engagement tracking and performance metrics

### API Integrations

- **X API v2** - Tweet fetching and monitoring
- **OpenAI/Anthropic** - Content processing and generation
- **Wikipedia Commons** - Player and club images
- **Email Service** - Newsletter distribution
- **Google AdSense** - Monetization integration

### Development Stack

- **Frontend** - Next.js 14+ with App Router
- **Styling** - TailwindCSS with custom brand configuration
- **Database** - Prisma ORM with NeonDB (PostgreSQL)
- **Deployment** - Vercel with environment configuration
- **Fonts** - Geist and Geist Mono from Vercel

---

## Success Criteria

### Performance Metrics

- **Content Quality** - 3 polished briefings delivered daily
- **Relevance** - >90% relevant tweet capture rate
- **Engagement** - Email open rate >30% within 3 months
- **Reliability** - <5% daily error rate in automation pipeline
- **Growth** - Steady subscriber acquisition through quality content

### Quality Indicators

- **Voice Consistency** - Maintain Joel Golby style across all content
- **Entertainment Value** - Content that people actually want to read
- **Technical Reliability** - Seamless automation without manual intervention
- **User Experience** - Fast, responsive, visually appealing interface

---

## Non-Goals

- **User Accounts** - No login system or user-generated content
- **Team Customization** - No custom team alerts (post-MVP consideration)
- **Mobile Apps** - Web-first approach, no native applications
- **Real-time Notifications** - Email and web only, no SMS/push
- **Social Features** - No commenting or community features

---

## Monetization Strategy

### Primary Revenue

- **Google AdSense** - Strategic ad placement on web archive
- **Newsletter Sponsorships** - Embedded sponsor content (future)
- **Premium Subscriptions** - Enhanced features for paying subscribers (future)

### Monetization Principles

- **User Experience First** - Ads enhance rather than disrupt reading
- **Content Quality Priority** - Never compromise editorial voice for revenue
- **Transparent Sponsorships** - Clear labeling of sponsored content

---

## Post-MVP Features

### Content Expansion

- **Transfer Rumour Heatmap** - Visual representation of transfer activity
- **Player-Specific Subscriptions** - Targeted content for specific interests
- **Weekend Roundups** - Weekly summary editions
- **Voice Narration** - Audio versions of briefings

### Technical Enhancements

- **WhatsApp Integration** - Share links and potential bot
- **Advanced Analytics** - Detailed engagement and performance metrics
- **API Access** - Third-party integrations for content syndication
- **Mobile Optimization** - Progressive Web App features

### Community Features

- **Subscriber Polls** - Engage audience in transfer predictions
- **Reader Submissions** - Curated user content with editorial oversight
- **Social Media Integration** - Cross-platform content distribution

---

## Risk Assessment

### Technical Risks

- **API Rate Limits** - X API usage restrictions
- **AI Processing Costs** - Content generation expenses
- **Automation Failures** - System reliability challenges

### Content Risks

- **Source Reliability** - ITK accuracy variations
- **Legal Considerations** - Copyright and fair use
- **Brand Consistency** - Maintaining voice quality

### Mitigation Strategies

- **Robust Error Handling** - Multiple fallback systems
- **Content Moderation** - AI safety checks and manual oversight
- **Legal Compliance** - Proper attribution and fair use practices
