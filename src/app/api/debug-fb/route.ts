import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.FB_PAGE_TOKEN ?? "";
  const pageId = process.env.FB_PAGE_ID ?? "";

  return NextResponse.json({
    pageId,
    tokenPrefix: token.slice(0, 20),
    tokenLength: token.length,
  });
}
