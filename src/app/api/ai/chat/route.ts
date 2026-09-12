import { NextRequest, NextResponse } from "next/server";
import { runDiagnosis, textTurn } from "@/lib/ai/diagnose";
import { buildFarmerReply } from "@/lib/ai/buildFarmerReply";
import type { ChatTurn } from "@/lib/ai/provider";

// Standalone AI chat endpoint used by the admin "Chat with Dr. Hen" widget to test
// the AI directly (not tied to a specific farmer's WhatsApp thread). Uses the exact
// same runDiagnosis + buildFarmerReply pipeline as the real farmer-facing flow in
// handleInboundWebhook.ts, so what the admin sees here is what a farmer would get.
export async function POST(req: NextRequest) {
  const { history } = (await req.json()) as { history: Array<{ role: "user" | "assistant"; text: string }> };

  if (!history?.length) {
    return NextResponse.json({ error: "history is required" }, { status: 400 });
  }

  const turns: ChatTurn[] = history.map((h) => textTurn(h.role, h.text));

  try {
    const diagnosis = await runDiagnosis(turns);
    const reply = buildFarmerReply(diagnosis);
    return NextResponse.json({ diagnosis, reply: reply.text, escalateToVet: reply.escalateToVet });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
