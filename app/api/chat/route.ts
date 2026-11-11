import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ChatMessage,
  executeRotatoCompletion,
  executeRotatoStream,
} from "@/lib/rotato";

export const runtime = "nodejs";

const BRAINFLOW_SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content: `You are BrainFlow, an advanced, intelligent, and versatile AI assistant created and designed by Ayantik Mallick.
Identity Guidelines:
- Your name is strictly BrainFlow.
- You were created by Ayantik Mallick.
- If asked "who are you?", "who r u?", or about your creators/identity, proudly identify as BrainFlow, built by Ayantik Mallick.
- NEVER claim to be ChatGPT, OpenAI, Anthropic, Gemini, or any other company's bot.
- You help users with coding, mathematics, research, writing, file analysis, and creative thinking with clear, elegant markdown formatting.`,
};

// Strict Zod Validation Schema
const MessageItemSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(25000),
});

const ChatBodySchema = z.object({
  message: z.string().max(20000).optional(),
  messages: z.array(MessageItemSchema).max(60).optional(),
  provider: z.string().max(50).optional(),
  model: z.string().max(100).optional(),
  stream: z.boolean().optional(),
});

function sanitizeInput(text: string): string {
  // Strip null bytes and dangerous control characters while preserving valid formatting
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

// In-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 40;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

// Clean up stale rate limit entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of rateLimitMap.entries()) {
      const active = timestamps.filter((t) => now - t < WINDOW_MS);
      if (active.length === 0) {
        rateLimitMap.delete(ip);
      } else {
        rateLimitMap.set(ip, active);
      }
    }
  }, 5 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before sending another message." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate Body using Zod
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const parseResult = ChatBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload format.", details: parseResult.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const {
      message,
      messages,
      provider,
      model,
      stream = true,
    } = parseResult.data;

    // 3. Format and Sanitize Messages
    let formattedMessages: ChatMessage[] = [];
    if (messages && messages.length > 0) {
      const sliced = messages.slice(-50);
      let totalLength = 0;

      for (const m of sliced) {
        const sanitized = sanitizeInput(m.content);
        totalLength += sanitized.length;

        formattedMessages.push({
          role: m.role,
          content: sanitized,
        });
      }

      // Guard total payload character length (max 80,000 characters)
      if (totalLength > 80000) {
        return NextResponse.json(
          { error: "Conversation history exceeds size limit. Please start a new chat." },
          { status: 413 }
        );
      }
    } else if (message && message.trim().length > 0) {
      formattedMessages = [{ role: "user", content: sanitizeInput(message) }];
    } else {
      return NextResponse.json(
        { error: "A non-empty message or messages array is required." },
        { status: 400 }
      );
    }

    // 4. Inject BrainFlow identity system prompt
    const existingSystemIdx = formattedMessages.findIndex((m) => m.role === "system");
    if (existingSystemIdx >= 0) {
      formattedMessages[existingSystemIdx] = BRAINFLOW_SYSTEM_PROMPT;
    } else {
      formattedMessages = [BRAINFLOW_SYSTEM_PROMPT, ...formattedMessages];
    }

    // 5. Non-streaming Execution
    if (stream === false) {
      const result = await executeRotatoCompletion({
        messages: formattedMessages,
        preferredProvider: provider,
        preferredModel: model,
      });

      return NextResponse.json({
        text: result.text,
      });
    }

    // 6. Streaming Execution
    const { stream: upstreamStream } = await executeRotatoStream({
      messages: formattedMessages,
      preferredProvider: provider,
      preferredModel: model,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new ReadableStream({
      async start(controller) {
        const reader = upstreamStream.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              const dataStr = trimmed.slice(5).trim();
              if (dataStr === "[DONE]") {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                continue;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const deltaContent =
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.choices?.[0]?.delta?.text ||
                  "";

                if (deltaContent) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "chunk",
                        text: deltaContent,
                      })}\n\n`
                    )
                  );
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (streamErr: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Stream interrupted",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(transformStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    // Sanitize logger: Avoid dumping raw payloads, tokens, or PII into logs
    console.error("[Chat Route Error]:", error?.message || "Internal processing error");
    return NextResponse.json(
      {
        error: "Failed to process chat request.",
        text: "BrainFlow encountered an error while processing your request. Please try again.",
      },
      { status: 500 }
    );
  }
}
