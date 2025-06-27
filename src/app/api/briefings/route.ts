import { NextRequest, NextResponse } from "next/server";
import { listBriefings } from "@/lib/database/briefings";
import { BriefingStatus } from "@/types/briefing";
import { League } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const leagueStrings = searchParams
      .get("leagues")
      ?.split(",")
      .filter(Boolean);
    const leagues = leagueStrings?.filter((l) =>
      Object.values(League).includes(l as League),
    ) as League[] | undefined;

    const result = await listBriefings({
      page,
      limit,
      status: BriefingStatus.Published,
      tags,
      leagues,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch briefings:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefings" },
      { status: 500 },
    );
  }
}
