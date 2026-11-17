export type RotatoProvider = "openrouter" | "groq" | "sambanova" | "cloudflare" | "deepseek" | "huggingface";

export interface RotatoModelOption {
  id: string;
  name: string;
  description?: string;
}

export interface ProviderCatalog {
  name: string;
  endpoint: string;
  defaultModel: string;
  models: RotatoModelOption[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const PROVIDER_CATALOGS: Record<RotatoProvider, ProviderCatalog> = {
  openrouter: {
    name: "OpenRouter",
    endpoint: "/openrouter/chat/completions",
    defaultModel: "openrouter/free",
    models: [
      { id: "openrouter/free", name: "Auto Rotate (Free)", description: "Smart auto-switching across providers for best speed and reliability." },
      { id: "deepseek/deepseek-chat", name: "DeepSeek Chat (V3)", description: "DeepSeek V3 — outstanding coding, mathematics & reasoning." },
      { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", description: "Alibaba's flagship powerhouse for reasoning & code." },
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", description: "Fast, intelligent, lightweight OpenAI model." },
      { id: "openrouter/auto", name: "OpenRouter Auto", description: "Automated routing across the best community models." },
    ],
  },
  groq: {
    name: "Groq",
    endpoint: "/groq/chat/completions",
    defaultModel: "openai/gpt-oss-120b",
    models: [
      { id: "openai/gpt-oss-120b", name: "Groq GPT OSS 120B", description: "High-reasoning 120B model on Groq hardware LPUs." },
      { id: "qwen/qwen3.8-27b", name: "Groq Qwen 3.8 27B", description: "Fast Qwen 3.8 27B on Groq LPUs." },
      { id: "openai/gpt-oss-20b", name: "Groq GPT OSS 20B", description: "Compact 20B ultra-fast model." },
      { id: "allam-2-7b", name: "ALLaM 2 7B", description: "Arabic/English bilingual LLM." },
    ],
  },
  cloudflare: {
    name: "Cloudflare",
    endpoint: "/cloudflare/chat/completions",
    defaultModel: "@cf/meta/llama-3.2-3b-instruct",
    models: [
      { id: "@cf/meta/llama-3.2-3b-instruct", name: "Cloudflare Llama 3.2 3B", description: "Meta Llama 3.2 on Cloudflare Workers AI." },
      { id: "@cf/meta/llama-3.1-8b-instruct", name: "Cloudflare Llama 3.1 8B", description: "Meta Llama 3.1 8B on Cloudflare Workers AI." },
    ],
  },
  sambanova: {
    name: "SambaNova",
    endpoint: "/sambanova/chat/completions",
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
    models: [
      { id: "Meta-Llama-3.3-70B-Instruct", name: "Llama 3.3 70B (SambaNova)", description: "Meta Llama 3.3 70B on SambaNova Sn40L." },
    ],
  },
  deepseek: {
    name: "DeepSeek",
    endpoint: "/deepseek/chat/completions",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat Direct", description: "Direct official DeepSeek API." },
    ],
  },
  huggingface: {
    name: "HuggingFace",
    endpoint: "/huggingface/chat/completions",
    defaultModel: "Qwen/Qwen2.5-72B-Instruct",
    models: [
      { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen 2.5 72B (HuggingFace)" },
    ],
  },
};

const DEFAULT_FALLBACK_ORDER: RotatoProvider[] = ["openrouter", "groq", "cloudflare"];
const ONLINE_ROTATO_URL = "https://rotato-kg3t.onrender.com";

export function getRotatoBaseUrls(): string[] {
  const envUrl = process.env.ROTATO_BASE_URL?.replace(/\/+$/, "");
  // Prioritize online Render URL in production / serverless environments
  const list: string[] = [];
  if (envUrl && !envUrl.includes("localhost")) {
    list.push(envUrl);
  }
  list.push(ONLINE_ROTATO_URL);
  if (envUrl && envUrl.includes("localhost")) {
    list.push(envUrl);
  }
  return list;
}

export function getTimeoutMs(): number {
  const t = process.env.ROTATO_TIMEOUT_MS;
  return t ? parseInt(t, 10) : 30000;
}

export function isEligibleForFallback(status: number): boolean {
  return status === 429 || status === 404 || status === 408 || (status >= 500 && status <= 599);
}

export interface RotatoCompletionResult {
  text: string;
  provider: RotatoProvider;
  model: string;
  fallbackOccurred: boolean;
  attemptedProviders: string[];
}

export async function executeRotatoCompletion(options: {
  messages: ChatMessage[];
  preferredProvider?: string;
  preferredModel?: string;
}): Promise<RotatoCompletionResult> {
  const baseUrls = getRotatoBaseUrls();
  const timeoutMs = getTimeoutMs();
  const attemptedProviders: string[] = [];

  let order: RotatoProvider[] = [...DEFAULT_FALLBACK_ORDER];
  if (
    options.preferredProvider &&
    options.preferredProvider in PROVIDER_CATALOGS &&
    options.preferredProvider !== "auto"
  ) {
    const pref = options.preferredProvider as RotatoProvider;
    order = [pref, ...DEFAULT_FALLBACK_ORDER.filter((p) => p !== pref)];
  }

  let lastError: Error | null = null;

  for (const baseUrl of baseUrls) {
    for (let i = 0; i < order.length; i++) {
      const provider = order[i];
      const isPreferred = i === 0 && options.preferredProvider === provider;
      const catalog = PROVIDER_CATALOGS[provider];
      const model = (isPreferred && options.preferredModel) || catalog.defaultModel;

      attemptedProviders.push(`${provider}:${model}@${baseUrl}`);

      const endpointUrl = `${baseUrl}${catalog.endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (process.env.ROTATO_API_KEY) {
          headers["Authorization"] = `Bearer ${process.env.ROTATO_API_KEY}`;
        }

        const res = await fetch(endpointUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: options.messages,
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.warn(
            `[Rotato] Provider ${provider} on ${baseUrl} failed with HTTP ${res.status}: ${errorText}`
          );

          if (isEligibleForFallback(res.status) && i < order.length - 1) {
            continue;
          }

          throw new Error(`Rotato [${provider}] HTTP ${res.status}: ${errorText || res.statusText}`);
        }

        const data = await res.json();
        const content =
          data.choices?.[0]?.message?.content ||
          (typeof data.choices?.[0]?.text === "string" ? data.choices[0].text : "");

        return {
          text: content || "",
          provider,
          model,
          fallbackOccurred: i > 0 || baseUrl !== baseUrls[0],
          attemptedProviders,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isAbort = err.name === "AbortError";
        const errMsg = isAbort ? `Request to ${provider} timed out after ${timeoutMs}ms` : err.message;
        console.warn(`[Rotato] Exception with ${provider} on ${baseUrl}: ${errMsg}`);
        lastError = err;

        if (i < order.length - 1) {
          continue;
        }
      }
    }
  }

  throw lastError || new Error(`All Rotato providers failed: ${attemptedProviders.join(", ")}`);
}

export async function executeRotatoStream(options: {
  messages: ChatMessage[];
  preferredProvider?: string;
  preferredModel?: string;
}): Promise<{
  stream: ReadableStream<Uint8Array>;
  provider: RotatoProvider;
  model: string;
  fallbackOccurred: boolean;
}> {
  const baseUrls = getRotatoBaseUrls();
  const timeoutMs = getTimeoutMs();

  let order: RotatoProvider[] = [...DEFAULT_FALLBACK_ORDER];
  if (
    options.preferredProvider &&
    options.preferredProvider in PROVIDER_CATALOGS &&
    options.preferredProvider !== "auto"
  ) {
    const pref = options.preferredProvider as RotatoProvider;
    order = [pref, ...DEFAULT_FALLBACK_ORDER.filter((p) => p !== pref)];
  }

  for (const baseUrl of baseUrls) {
    for (let i = 0; i < order.length; i++) {
      const provider = order[i];
      const isPreferred = i === 0 && options.preferredProvider === provider;
      const catalog = PROVIDER_CATALOGS[provider];
      const model = (isPreferred && options.preferredModel) || catalog.defaultModel;

      const endpointUrl = `${baseUrl}${catalog.endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (process.env.ROTATO_API_KEY) {
          headers["Authorization"] = `Bearer ${process.env.ROTATO_API_KEY}`;
        }

        const res = await fetch(endpointUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: options.messages,
            stream: true,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.warn(`[Rotato Stream] ${provider} on ${baseUrl} failed with ${res.status}: ${errorText}`);

          if (isEligibleForFallback(res.status) && i < order.length - 1) {
            continue;
          }

          throw new Error(`Rotato [${provider}] stream HTTP ${res.status}`);
        }

        if (!res.body) {
          throw new Error(`Rotato [${provider}] response had no readable stream body`);
        }

        return {
          stream: res.body,
          provider,
          model,
          fallbackOccurred: i > 0 || baseUrl !== baseUrls[0],
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`[Rotato Stream] Error with ${provider} on ${baseUrl}: ${err.message}`);

        if (i < order.length - 1) {
          continue;
        }
      }
    }
  }

  throw new Error("All Rotato streaming providers and base URLs failed");
}
