import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeRotatoCompletion } from "@/lib/rotato";

export const runtime = "nodejs";

const TitleBodySchema = z.object({
  prompt: z.string().min(1).max(3000),
});

function toTitleCase(str: string): string {
  const smallWords = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "if", "in",
    "nor", "of", "on", "or", "so", "the", "to", "up", "yet", "is", "it"
  ]);
  const words = str.trim().split(/\s+/);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && smallWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function sanitizeTitleInput(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parseResult = TitleBodySchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({ title: "New Conversation" });
    }

    const cleanPrompt = sanitizeTitleInput(parseResult.data.prompt);

    const systemPrompt =
      "You are a conversation title generator. Output a concise 3 to 5 word topic title in Title Case (e.g. 'Locating Lost Website', 'Clean C Drive Space', 'Coding Assistance') summarizing the user request. Never output all caps, never use quotes or punctuation. Output ONLY the title.";

    const result = await executeRotatoCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanPrompt.slice(0, 300) },
      ],
    }).catch(() => null);

    let raw = result?.text || "";
    let cleanTitle = raw.trim().replace(/^["']|["']$/g, "").split("\n")[0].trim();

    if (!cleanTitle || cleanTitle.length < 2 || cleanTitle.length > 50) {
      const words = cleanPrompt.split(/\s+/).slice(0, 5).join(" ");
      cleanTitle = words;
    }

    // Enforce proper Title Case and remove any all-caps
    cleanTitle = toTitleCase(cleanTitle);

    return NextResponse.json({ title: cleanTitle });
  } catch {
    return NextResponse.json({ title: "New Conversation" });
  }
}
