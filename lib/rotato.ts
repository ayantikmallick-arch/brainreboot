export type RotatoProvider = "groq" | "openrouter" | "cloudflare";

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
  groq: {
    name: "Groq",
    endpoint: "/groq/chat/completions",
    defaultModel: "openai/gpt-oss-20b",
    models: [
      { id: "openai/gpt-oss-20b", name: "GPT OSS 20B (Ultra Fast)" },
      { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B" },
      { id: "openai/gpt-oss-120b", name: "GPT OSS 120B (High Reasoning)" },
      { id: "allam-2-7b", name: "ALLaM 2 7B" },
    ],
  },
  openrouter: {
    name: "OpenRouter",
    endpoint: "/openrouter/chat/completions",
    defaultModel: "openrouter/free",
    models: [
      { id: "openrouter/free", name: "Free Router (Auto Free Models)" },
      { id: "openrouter/auto", name: "OpenRouter Auto" },
    ],
  },
  cloudflare: {
    name: "Cloudflare",
    endpoint: "/cloudflare/chat/completions",
    defaultModel: "@cf/meta/llama-3.2-3b-instruct",
    models: [
      { id: "@cf/meta/llama-3.2-3b-instruct", name: "Llama 3.2 3B Instruct" },
      { id: "@cf/meta/llama-3.2-1b-instruct", name: "Llama 3.2 1B Instruct" },
    ],
  },
};

const DEFAULT_FALLBACK_ORDER: RotatoProvider[] = ["groq", "openrouter", "cloudflare"];

export function getRotatoBaseUrl(): string {
  const url = process.env.ROTATO_BASE_URL || "http://localhost:8990";
  return url.replace(/\/+$/, "");
}

export function getTimeoutMs(): number {
  const t = process.env.ROTATO_TIMEOUT_MS;
  return t ? parseInt(t, 10) : 30000;
}

export function isEligibleForFallback(status: number): boolean {
  // 429 = Rate limited
  // 404 = Model not found or deprecated
  // 408 = Request timeout
  // 500-599 = Server error / Cloudflare / Upstream outages
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
  const baseUrl = getRotatoBaseUrl();
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

  for (let i = 0; i < order.length; i++) {
    const provider = order[i];
    const isPreferred = i === 0 && options.preferredProvider === provider;
    const catalog = PROVIDER_CATALOGS[provider];
    const model = (isPreferred && options.preferredModel) || catalog.defaultModel;

    attemptedProviders.push(`${provider}:${model}`);

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
          `[Rotato] Provider ${provider} failed with HTTP ${res.status}: ${errorText}`
        );

        if (isEligibleForFallback(res.status) && i < order.length - 1) {
          console.warn(`[Rotato] Falling back from ${provider} to ${order[i + 1]}...`);
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
        fallbackOccurred: i > 0,
        attemptedProviders,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === "AbortError";
      const errMsg = isAbort ? `Request to ${provider} timed out after ${timeoutMs}ms` : err.message;
      console.warn(`[Rotato] Exception with provider ${provider}: ${errMsg}`);
      lastError = err;

      if (i < order.length - 1) {
        console.warn(`[Rotato] Falling back from ${provider} to ${order[i + 1]} due to exception...`);
        continue;
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
  const baseUrl = getRotatoBaseUrl();
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

  let lastError: Error | null = null;

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
        console.warn(
          `[Rotato Stream] Provider ${provider} failed with HTTP ${res.status}: ${errorText}`
        );

        if (isEligibleForFallback(res.status) && i < order.length - 1) {
          console.warn(`[Rotato Stream] Falling back from ${provider} to ${order[i + 1]}...`);
          continue;
        }

        throw new Error(`Rotato [${provider}] HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      if (!res.body) {
        throw new Error(`No response body returned from ${provider}`);
      }

      return {
        stream: res.body,
        provider,
        model,
        fallbackOccurred: i > 0,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[Rotato Stream] Exception with ${provider}: ${err.message}`);
      lastError = err;

      if (i < order.length - 1) {
        continue;
      }
    }
  }

  throw lastError || new Error("All Rotato streaming providers failed");
}
