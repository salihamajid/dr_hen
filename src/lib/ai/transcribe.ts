// Voice-note transcription. Gemini can technically accept audio input directly,
// but a real WhatsApp voice note still needs its bytes fetched from Meta first,
// so this ships as a pluggable interface mirroring the WhatsApp mock/real
// pattern: a mock that returns whatever transcript the demo panel was given, and
// a Whisper-backed stub for when a free/cheap transcription key is wired up later.

export interface TranscribeProvider {
  transcribe(audio: { url?: string; base64?: string; mimeType: string }, hint?: string): Promise<string>;
}

const mockTranscribe: TranscribeProvider = {
  async transcribe(_audio, hint) {
    // In the demo, the "voice note" is simulated by having the admin type the
    // transcript directly into the SimulateIncomingPanel — hint carries that text.
    return hint ?? "[voice note received — no transcript available in mock mode]";
  },
};

const whisperTranscribe: TranscribeProvider = {
  async transcribe(audio) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for real voice-note transcription (TRANSCRIBE_PROVIDER=whisper).");
    }
    // Real implementation would POST audio.url/base64 to the Whisper API here.
    // Left unimplemented — a real transcription key is a known gap for this demo.
    throw new Error("Whisper transcription is not wired up yet — supply OPENAI_API_KEY and implement whisperTranscribe.");
  },
};

export const transcribeProvider: TranscribeProvider =
  process.env.TRANSCRIBE_PROVIDER === "whisper" ? whisperTranscribe : mockTranscribe;
