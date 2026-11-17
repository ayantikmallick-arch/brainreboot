import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ChatMessage,
  executeRotatoCompletion,
  executeRotatoStream,
} from "@/lib/rotato";

export const runtime = "nodejs";

function buildBrainFlowSystemPrompt(modelName: string, providerName: string): ChatMessage {
  return {
    role: "system",
    content: `You are BrainFlow, an advanced, intelligent, and versatile AI assistant created and designed by Ayantik Mallick.

Active Engine & Architecture:
- You are currently running on and powered by the ${modelName} model via ${providerName} (routed through the Rotato proxy).
- If the user explicitly asks which model, engine, or provider is being used (e.g. "which model am i using?", "what model are you?"), inform them clearly that you are BrainFlow powered by the ${modelName} model via ${providerName}.

Identity Guidelines:
- Your name is strictly BrainFlow.
- You were created and engineered by Ayantik Mallick.
- If asked "who are you?", "who r u?", or about your creators/identity, proudly identify as BrainFlow, built by Ayantik Mallick.
- Special Easter Egg / Identity Rule: If anyone asks who Annesha Sikdar is (or any question about Annesha / Annesha Sikdar), ALWAYS respond: "The love of my creator Ayantik's life ❤️".
- NEVER claim to be OpenAI, Anthropic, or any other company as your identity; your identity is BrainFlow, engineered by Ayantik Mallick, running on the ${modelName} engine.
- You help users with coding, mathematics, research, writing, file analysis, and creative thinking with clear, elegant markdown formatting.

Formatting & Markdown Instructions:
- Always format responses using valid, standard GitHub Flavored Markdown (GFM).
- For side-by-side comparisons, feature breakdowns, pros/cons, and structured technical data, ALWAYS use standard Markdown tables.
- Table Rules:
  * Each table row MUST be on its own separate line.
  * Always include a standard header row and delimiter row (e.g. | Feature | Option A | Option B | followed by | :--- | :--- | :--- |).
  * Always leave a blank line before and after a table.
- NEVER output raw HTML tags (such as <br>, <table>, <tr>, <td>, <p>, <div>, or <b>) for formatting. Use standard Markdown equivalents (**bold**, *italic*, bullet lists with -, numbered lists with 1., headings with #/##/###, and standard line breaks).
- For code and terminal commands, always use fenced code blocks with language identifiers (e.g. \`\`\`typescript, \`\`\`python, \`\`\`bash).
- Structure responses with readable headings (#, ##, ###), organized bullet points, and clean spacing.`,
  };
}

const ANNESHA_RESPONSE = "The love of my creator Ayantik's life ❤️";

function isAnneshaQuery(text: string): boolean {
  if (!text) return false;
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Match variants/spellings: annesha, anesha, anisha
  const hasAnnesha = /\b(ann?esh?a|ann?ish?a)\b/i.test(clean);
  const hasSikdar = /\b(sikdar|shikdar)\b/i.test(clean);

  // If both "annesha" and "sikdar" appear in the query
  if (hasAnnesha && hasSikdar) {
    return true;
  }

  // If "annesha" appears with inquiry words (who, about, is, tell, know, etc.)
  if (
    hasAnnesha &&
    /\b(who|whos|who's|is|about|tell|know|konta|kaun|ke|love|girlfriend|gf|crush|wife)\b/i.test(clean)
  ) {
    return true;
  }

  // If the query is simply "annesha" or "annesha sikdar"
  if (
    clean === "annesha" ||
    clean === "annesha sikdar" ||
    clean === "aneshasikdar"
  ) {
    return true;
  }

  return false;
}

function isModelQuery(text: string): boolean {
  if (!text) return false;
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Direct short queries
  if (
    clean === "which model" ||
    clean === "what model" ||
    clean === "model" ||
    clean === "current model" ||
    clean === "active model" ||
    clean === "who powers you" ||
    clean === "what engine"
  ) {
    return true;
  }

  const mentionsModel = /\b(model|models|engine|engines|llm|llms|architecture)\b/i.test(clean);
  const mentionsInquiry = /\b(which|what|tell|show|know|who)\b/i.test(clean);
  const mentionsUsage = /\b(using|use|active|running|selected|current|power|powers|powering)\b/i.test(clean);
  const mentionsYouOrI = /\b(i|you|u|we|this|chat)\b/i.test(clean);

  if (mentionsModel && mentionsInquiry) {
    return true;
  }
  if (mentionsModel && mentionsUsage && mentionsYouOrI) {
    return true;
  }

  return false;
}

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
  modelName: z.string().max(100).optional(),
  providerName: z.string().max(100).optional(),
  adminPasscode: z.string().max(50).optional(),
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
      provider: requestedProvider,
      model: requestedModel,
      modelName: requestedModelName,
      providerName: requestedProviderName,
      adminPasscode,
      stream = true,
    } = parseResult.data;

    // Admin passcode check (default: "admin")
    const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "admin";
    const isAdmin = adminPasscode?.trim() === ADMIN_PASSCODE;

    let provider = requestedProvider;
    let model = requestedModel;
    let modelName = requestedModelName;
    let providerName = requestedProviderName;

    // Enforce Premium rule: custom model selection requires Admin/Pro access
    if (requestedModel && requestedModel !== "auto" && requestedModel !== "openrouter/free" && !isAdmin) {
      provider = "openrouter";
      model = "openrouter/free";
      modelName = "Auto Rotate";
      providerName = "OpenRouter";
    }

    if (!modelName) {
      if (model === "openai/gpt-oss-120b") modelName = "Groq GPT OSS 120B";
      else if (model === "qwen/qwen3.8-27b") modelName = "Groq Qwen 3.8 27B";
      else if (model === "openai/gpt-oss-20b") modelName = "Groq GPT OSS 20B";
      else if (model === "deepseek/deepseek-chat") modelName = "DeepSeek Chat (V3)";
      else if (model === "qwen/qwen-2.5-72b-instruct") modelName = "Qwen 2.5 72B";
      else if (model === "openai/gpt-4o-mini") modelName = "GPT-4o Mini";
      else if (model === "meta-llama/llama-3.3-70b-instruct") modelName = "Llama 3.3 70B";
      else if (model === "@cf/meta/llama-3.2-3b-instruct") modelName = "Cloudflare Llama 3.2 3B";
      else modelName = model || "Auto Rotate";
    }

    if (!providerName) {
      if (provider === "groq") providerName = "Groq LPUs";
      else if (provider === "cloudflare") providerName = "Cloudflare Workers AI";
      else if (provider === "openrouter") providerName = "OpenRouter";
      else providerName = provider ? provider.toUpperCase() : "Rotato";
    }

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

    // 4. Check for Easter Egg: Annesha Sikdar
    const lastUserMessage =
      [...formattedMessages].reverse().find((m) => m.role === "user")?.content || "";

    if (isAnneshaQuery(lastUserMessage)) {
      if (stream === false) {
        return NextResponse.json({
          text: ANNESHA_RESPONSE,
        });
      }

      const encoder = new TextEncoder();
      const easterEggStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "chunk",
                text: ANNESHA_RESPONSE,
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(easterEggStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // 4b. Check for Model Inquiry: e.g. "which model am i using"
    if (isModelQuery(lastUserMessage)) {
      const modelAnswer = `You are currently using **BrainFlow**, powered by the **${modelName}** model via **${providerName}** on Rotato.

- **Active Model:** \`${model || "openrouter/free"}\`
- **Engine Provider:** \`${provider || "openrouter"}\` (${providerName})
- **Routing:** Direct Rotato Proxy with live key rotation`;

      if (stream === false) {
        return NextResponse.json({
          text: modelAnswer,
        });
      }

      const encoder = new TextEncoder();
      const modelStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "chunk",
                text: modelAnswer,
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(modelStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // 5. Inject BrainFlow identity system prompt with dynamic model knowledge
    const activeSystemPrompt = buildBrainFlowSystemPrompt(modelName, providerName);
    const existingSystemIdx = formattedMessages.findIndex((m) => m.role === "system");
    if (existingSystemIdx >= 0) {
      formattedMessages[existingSystemIdx] = activeSystemPrompt;
    } else {
      formattedMessages = [activeSystemPrompt, ...formattedMessages];
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
