**Product Requirements Document (PRD)**

**Project Name:** Transfer Juice — Premier League ITK Transfer Digest

**Owner:** Dean

**Date:** June 18, 2025

---

### **Overview**

Transfer Juice is a fully automated football transfer newsletter and web digest that checks top-tier Premier League ITK sources three times a day, summarises their posts into a flowing, article-style briefing, and distributes the result via email and a clean web interface. Each edition includes hyperlinks to tweets and referenced sources, along with contextual images pulled from tweet media or Wikipedia.

---

### **Goals**

* Provide reliable, beautifully written Premier League transfer summaries.
* Automate checking and summarising from pre-approved ITK sources.
* Deliver polished, readable email digests three times a day.
* Offer a responsive web archive of each digest edition.
* Include a seamless newsletter sign-up flow.

---

### **Key Features**

#### 1. **Source Monitoring**

* Query X (Twitter) API v2 for specific handles (e.g. @FabrizioRomano, @David\_Ornstein, etc.)
* Pull tweets from \~10–15 accounts, every 3–4 hours.
* Store tweet content, timestamp, media URL (if any), tweet link.

#### 2. **Content Processing**

* Filter tweets for transfer relevance using keyword matching (e.g. "signing", "fee", "medical", "contract")
* Feed filtered content to GPT-4 or Claude to:

  * Extract key info (who, what, fee, timing)
  * Reformat into a cohesive editorial article with smooth transitions
  * Maintain tone and flow as one natural news brief (not bullet points)

#### 3. **Image Integration**

* Pull featured images from:

  * Tweet media if present (with fallback to preview thumbnails)
  * Wikipedia Commons API (e.g. player headshots)
* Embed images contextually within the article

#### 4. **Email Output**

* Generate a clean, editorial-style HTML email
* Use consistent structure:

  * Heading: Morning / Afternoon / Evening Brief
  * Main content: flowing article w/ embedded links + images
* Send via service like ConvertKit, MailerLite, or Postmark

#### 5. **Web Archive + Sign-Up**

* Web app built with Next.js and TailwindCSS
* Public archive of all briefs: /morning, /afternoon, /evening
* Each page styled like an online article (medium/substack style)
* Sticky email sign-up component on every edition
* Cron job posts content to both web and email simultaneously

#### 6. **Automation & Scheduling**

* Cron job triggers 3x per day (08:00, 14:00, 20:00 BST)
* Fetch tweets → parse → summarise → format → send
* Logs retained for backup and optional debugging

---

### **Non-Goals**

* No user account system or commenting
* No support for custom team alerts (yet)
* No SMS or mobile notifications

---

### **Success Criteria**

* Daily delivery of 3 polished briefings
* > 90% relevant tweet capture rate
* Email open rate >30% within 3 months
* Fully automated pipeline with <5% daily error rate

---

### **Nice-to-Haves** (Post-MVP)

* Daily transfer rumour “heatmap”
* Player-specific subscription options
* WhatsApp share links / bots
* Voice narration for digest editions
