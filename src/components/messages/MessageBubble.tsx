interface MessageLike {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  senderType: "FARMER" | "AI_AGENT" | "ADMIN" | "FIELD_VET";
  contentType: "TEXT" | "IMAGE" | "VOICE" | "VIDEO" | "TEMPLATE";
  textContent: string | null;
  mediaUrl: string | null;
  detectedLanguage: string | null;
  createdAt: string | Date;
}

const SENDER_LABEL: Record<MessageLike["senderType"], string> = {
  FARMER: "Farmer",
  AI_AGENT: "Dr. Hen (AI)",
  ADMIN: "Admin",
  FIELD_VET: "Field Vet",
};

export function MessageBubble({ message }: { message: MessageLike }) {
  const isInbound = message.direction === "INBOUND";
  const isImageData = message.mediaUrl?.startsWith("data:image");

  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
          isInbound ? "bg-white text-black" : "bg-brand-green text-white"
        }`}
      >
        <div className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${isInbound ? "text-black/40" : "text-white/70"}`}>
          {SENDER_LABEL[message.senderType]}
          {message.detectedLanguage && ` · ${message.detectedLanguage.toUpperCase()}`}
        </div>

        {message.contentType === "IMAGE" && isImageData && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.mediaUrl!} alt="Farmer submitted" className="mb-2 max-h-56 rounded-lg" />
        )}
        {message.contentType === "VIDEO" && <div className="mb-1 text-xs italic opacity-80">🎥 Video sent</div>}
        {message.contentType === "VOICE" && <div className="mb-1 text-xs italic opacity-80">🎙️ Voice note (transcribed below)</div>}

        <p className="whitespace-pre-wrap">{message.textContent}</p>

        <div className={`mt-1 text-right text-[10px] ${isInbound ? "text-black/30" : "text-white/60"}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
