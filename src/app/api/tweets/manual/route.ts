import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateTerryComment } from "@/lib/terry";

const prisma = new PrismaClient();

interface ManualTweetRequest {
  sourceName: string;
  sourceHandle: string;
  content: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - you can improve this
    const authHeader = request.headers.get("x-api-key");
    if (authHeader !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ManualTweetRequest = await request.json();

    // Validate input
    if (!body.sourceName || !body.sourceHandle || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Ensure source exists
    const source = await prisma.source.upsert({
      where: { handle: body.sourceHandle },
      update: {},
      create: {
        name: body.sourceName,
        handle: body.sourceHandle,
      },
    });

    // Create tweet
    const tweet = await prisma.tweet.create({
      data: {
        tweetId: `manual-${Date.now()}`,
        content: body.content,
        url:
          body.url ||
          `https://twitter.com/${body.sourceHandle.replace("@", "")}/status/${Date.now()}`,
        sourceId: source.id,
      },
    });

    // Generate Terry comment
    const terryComment = await generateTerryComment(body.content);

    // Create story
    const story = await prisma.story.create({
      data: {
        tweetId: tweet.id,
        terryComment,
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      tweet: {
        id: tweet.id,
        content: tweet.content,
        source: {
          name: source.name,
          handle: source.handle,
        },
      },
      story: {
        id: story.id,
        terryComment: story.terryComment,
      },
    });
  } catch (error) {
    console.error("Failed to add manual tweet:", error);
    await prisma.$disconnect();
    return NextResponse.json({ error: "Failed to add tweet" }, { status: 500 });
  }
}
