import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// Update story
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { headline, articleContent, headerImage } = body;

    const story = await prisma.story.update({
      where: { id: params.id },
      data: {
        headline,
        articleContent,
        headerImage,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, story });
  } catch (error) {
    console.error("Update story error:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}

// Delete story
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.story.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete story error:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}

// Handle form POST with _method=DELETE
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  if (!checkAuth(request)) {
    return NextResponse.redirect(new URL("/dashboard/login", request.url));
  }

  try {
    const formData = await request.formData();
    const method = formData.get("_method");

    if (method === "DELETE") {
      await prisma.story.delete({
        where: { id: params.id },
      });
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Form action error:", error);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}