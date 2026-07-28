import { NextRequest, NextResponse } from "next/server";

// ============================================================
// CineVault — Gemini AI Chat Proxy (Server-Side)
// Keeps the Gemini API key hidden from client-side code.
// ============================================================

const SYSTEM_PROMPT = `
Kamu adalah CineBot, asisten rekomendasi film AI yang cerdas, ahli, dan ceria.
Tugas kamu adalah membantu pengguna menemukan film menarik yang relevan dengan pertanyaan, mood, atau preferensi mereka.

Kamu WAJIB mengembalikan respon hanya dalam format JSON Array terstruktur tanpa markdown wrapper (\`\`\`json ... \`\`\`).
Format JSON harus berupa Array dari objek dengan properti berikut:
1. Jika pengguna meminta rekomendasi film atau membagikan mood nonton:
   Kembalikan daftar film rekomendasi:
   - "title": (string) Judul film dalam bahasa Inggris (agar pencarian TMDB akurat)
   - "reason": (string) Penjelasan singkat, emosional, dan ceria dalam bahasa Indonesia kenapa merekomendasikan film ini.
   Maksimal berikan 4 rekomendasi film dalam satu respon.

2. Jika pengguna hanya menyapa (seperti 'Halo', 'p', 'hi'), mengobrol santai, atau bertanya hal umum non-film:
   Kembalikan balasan teks biasa:
   - "chatResponse": (string) Jawaban santai Anda dalam bahasa Indonesia yang bersahabat dan ceria, lalu tawarkan bantuan mencari film.
   - "title": "" (kosongkan)
   - "reason": "" (kosongkan)
`;

export async function POST(req: NextRequest) {
  try {
    // 1. Validate request body
    const body = await req.json();
    const { messages, userMessage, customKey } = body;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "userMessage is required" },
        { status: 400 }
      );
    }

    // 2. Determine API key — custom user key takes priority, then server env
    const apiKey = customKey || process.env.GEMINI_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Set GEMINI_KEY in environment variables." },
        { status: 500 }
      );
    }

    // 3. Build conversation history for Gemini
    const conversationParts = [
      { text: SYSTEM_PROMPT },
      ...(Array.isArray(messages)
        ? messages.map((m: { role: string; content: string }) => ({
            text: `${m.role === "user" ? "Pengguna" : "CineBot"}: ${m.content}`,
          }))
        : []),
      { text: `Pengguna: ${userMessage}` },
    ];

    // 4. Call Gemini API (server-side — key never reaches client)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: conversationParts }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Gagal menghubungi Gemini API", status: response.status },
        { status: response.status }
      );
    }

    const resData = await response.json();
    const rawText =
      resData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    return NextResponse.json({ result: rawText });
  } catch (err) {
    console.error("Chat API route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
