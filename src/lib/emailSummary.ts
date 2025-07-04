import { PrismaClient } from "@prisma/client";
import sgMail from "@sendgrid/mail";

const prisma = new PrismaClient();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function generateDailyEmailSummary() {
  // Get yesterday's briefings
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const briefings = await prisma.briefing.findMany({
    where: {
      publishedAt: {
        gte: yesterday,
        lt: today,
      },
    },
    include: {
      stories: {
        include: {
          story: {
            include: {
              tweet: {
                include: {
                  source: true,
                },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  if (briefings.length === 0) {
    console.log("No briefings from yesterday to summarize");
    return;
  }

  // Collect all stories
  const allStories = briefings.flatMap((b) => b.stories);

  // Generate HTML email
  const html = generateEmailHTML(allStories, yesterday);

  // Get active subscribers
  const subscribers = await prisma.user.findMany({
    where: { isActive: true },
  });

  if (subscribers.length === 0) {
    console.log("No active subscribers");
    return;
  }

  // Send emails
  for (const subscriber of subscribers) {
    try {
      await sgMail.send({
        to: subscriber.email,
        from: "newsletter@transferjuice.com",
        subject: `Transfer News Summary - ${yesterday.toLocaleDateString(
          "en-GB",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        )}`,
        html,
      });
      console.log(`Email sent to ${subscriber.email}`);
    } catch (error) {
      console.error(`Failed to send to ${subscriber.email}:`, error);
    }
  }

  await prisma.$disconnect();
}

function generateEmailHTML(stories: any[], date: Date): string {
  const storiesHTML = stories
    .map(
      ({ story }) => `
    <div style="border-bottom: 1px solid #e5e5e5; padding: 20px 0;">
      <div style="margin-bottom: 10px;">
        <strong>${story.tweet.source.name}</strong> ${story.tweet.source.handle}
      </div>
      <div style="margin-bottom: 15px; color: #333;">
        ${story.tweet.content}
      </div>
      <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
        <em style="color: #666;">Terry says: ${story.terryComment}</em>
      </div>
      <div style="margin-top: 10px;">
        <a href="${story.tweet.url}" style="color: #1da1f2; text-decoration: none;">View on Twitter →</a>
      </div>
    </div>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transfer News Summary</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #000; margin-bottom: 10px;">Transfer News Summary</h1>
        <p style="color: #666;">${date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p>Here's what happened in the transfer world yesterday:</p>
      </div>
      
      ${storiesHTML}
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 14px;">
        <p>You're receiving this because you subscribed to TransferJuice daily summaries.</p>
        <p><a href="#" style="color: #666;">Unsubscribe</a></p>
      </div>
    </body>
    </html>
  `;
}
