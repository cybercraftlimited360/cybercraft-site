import { NextRequest, NextResponse } from "next/server";

// Twilio calls this webhook after every call ends with the final call status.
// Amy is voice-only. SMS marketing is handled by a separate intentional workflow.
// This route acknowledges the webhook — no SMS is sent here under any circumstance.
export async function POST(_req: NextRequest) {
  return new NextResponse("ok");
}
