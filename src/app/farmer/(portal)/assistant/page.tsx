import { MessageCircle } from "lucide-react";
import { ChatPanel } from "@/components/farmer/ChatPanel";
import { requireFarmer } from "@/lib/auth/dal";
import { getT } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { prisma } from "@/lib/prisma";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

export const generateMetadata = () => localizedTitle("title.assistant");
export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const { farmerId, language } = await requireFarmer();
  const t = getT(language);

  const [recent, waLink] = await Promise.all([
    prisma.message.findMany({
      where: { farmerId, channel: "IN_APP" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        direction: true,
        senderType: true,
        contentType: true,
        textContent: true,
        mediaUrl: true,
        detectedLanguage: true,
        createdAt: true,
      },
    }),
    whatsappChatLink(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{t("chat.title")}</h1>
          <p className="text-xs text-black/50">{t("chat.subtitle")}</p>
        </div>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-[#25d366] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1fb857]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> {t("assistant.chatWhatsapp")}
          </a>
        )}
      </div>
      <ChatPanel initialMessages={JSON.parse(JSON.stringify(recent.reverse()))} />
    </div>
  );
}
