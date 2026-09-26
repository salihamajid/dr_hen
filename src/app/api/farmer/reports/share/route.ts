import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFarmerApi } from "@/lib/auth/dal";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { isLimited, recordAttempt, retryAfterSeconds } from "@/lib/auth/rateLimit";
import { loadReport } from "@/lib/reports/queries";
import { reportToText } from "@/lib/reports/reportText";
import { reportRequestSchema } from "@/lib/validators/reportQuery";
import { whatsapp } from "@/lib/whatsapp";
import { isSessionWindowOpen } from "@/lib/whatsapp/sessionWindow";

const MAX_SHARES_PER_WINDOW = 10; // per farmer per 15 min

// Sends a text summary of the report to the farmer's OWN registered WhatsApp number,
// through the app's existing WhatsApp connection (no second number or webhook). There
// is deliberately no "recipient" field: a farmer can't use this to message other
// people from Dr. Hen's number, or to send their data anywhere but their own phone.
export async function POST(req: NextRequest) {
  const auth = await requireFarmerApi();
  if (!auth.ok) return auth.response;

  const limitKey = `report-share:${auth.farmerId}`;
  if (isLimited(limitKey, MAX_SHARES_PER_WINDOW)) {
    const res = jsonError(429, "Too many shares. Please try again in a few minutes.");
    res.headers.set("Retry-After", String(retryAfterSeconds(limitKey)));
    return res;
  }

  const body = await parseJsonBody(req, reportRequestSchema);
  if (!body.ok) return body.response;

  const [loaded, farmer] = await Promise.all([
    loadReport(auth.farmerId, body.data),
    prisma.farmer.findFirst({ where: { id: auth.farmerId }, select: { id: true, name: true, whatsappNumber: true } }),
  ]);
  if (!loaded.ok) return jsonError(loaded.status, loaded.error);
  if (!farmer) return jsonError(404, "Not found");

  // Outside Meta's 24h window a freeform message is rejected. Tell the client so it can
  // offer the wa.me chat link: messaging Dr. Hen first opens the window.
  if (!(await isSessionWindowOpen(farmer.id))) {
    return NextResponse.json({ sent: false, windowClosed: true });
  }

  recordAttempt(limitKey);
  // The message goes out in the farmer's own language (screens and WhatsApp text; the PDF stays English).
  const text = reportToText(loaded.report, farmer.name, auth.language ?? "EN");
  try {
    const result = await whatsapp.sendText(farmer.whatsappNumber, text);
    await prisma.message.create({
      data: {
        farmerId: farmer.id,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        senderType: "AI_AGENT",
        contentType: "TEXT",
        textContent: text,
        whatsappMessageId: result.messageId,
      },
    });
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[report share] WhatsApp send failed:", err);
    return jsonError(502, "Could not send to WhatsApp right now. Please try again, or download the PDF.");
  }
}
