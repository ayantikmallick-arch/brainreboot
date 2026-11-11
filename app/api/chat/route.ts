import { NextRequest, NextResponse } from "next/server";
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

    // 2. Parse Body with Safety Check
    const body = await req.json().catch(() => ({}));
    const {
      message,
      messages,
      provider,
      model,
      stream = true,
    } = body;

    // 3. Validate and Format Messages
    let formattedMessages: ChatMessage[] = [];
    if (Array.isArray(messages) && messages.length > 0) {
      // Guard against payload bomb (max 60 messages)
      const sliced = messages.slice(-50);
      let totalLength = 0;

      for (const m of sliced) {
        const rawContent = String(m.content || "");
        // Max 20,000 chars per message
        const sanitizedContent = rawContent.slice(0, 20000);
        totalLength += sanitizedContent.length;

        formattedMessages.push({
          role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
          content: sanitizedContent,
        });
      }

      // Guard total payload character length (max 80,000 characters)
      if (totalLength > 80000) {
        return NextResponse.json(
          { error: "Conversation history exceeds size limit. Please start a new chat." },
          { status: 413 }
        );
      }
    } else if (typeof message === "string" && message.trim().length > 0) {
      formattedMessages = [{ role: "user", content: message.trim().slice(0, 20000) }];
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
    console.error("[Chat Route Error]:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request.",
        text: "BrainFlow encountered an error while processing your request. Please try again.",
      },
      { status: 500 }
    );
  }
}
