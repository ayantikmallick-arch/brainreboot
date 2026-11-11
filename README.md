# BrainFlow (BrainReboot)

> Next-generation AI assistant built with Next.js, Tailwind CSS, Firebase Authentication, and Rotato Multi-Provider Engine.

---

## Features

- **Multi-Provider AI Fallback Engine:** Server-side fault tolerance across Groq, OpenRouter, and Cloudflare.
- **Real-Time Streaming:** Progressive token streaming via Server-Sent Events (SSE).
- **Stealth AI Layer:** Zero client-side API keys or provider exposure.
- **Dynamic Particle Constellation Background:** Interactive motion canvas design.
- **Smart Conversation Naming:** Automatically generates clean Title-Case titles from first messages.
- **Projects & History Management:** Group conversations by project, search history, and delete or export chats.
- **File & Code Attachment Support:** Upload and parse text, markdown, code, and document files up to 8MB.
- **Firebase Authentication:** Google Sign-in and Email/Password with Guest mode support.
- **Security Hardened:** Strict HTTP headers (HSTS, X-Frame-Options, CSP, nosniff), IP rate-limiting, and payload validation.

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and set your local or remote Rotato instance:

```bash
cp .env.example .env.local
```

```env
ROTATO_BASE_URL=http://localhost:8990
ROTATO_DEFAULT_PROVIDER=groq
ROTATO_DEFAULT_MODEL=openai/gpt-oss-20b
ROTATO_TIMEOUT_MS=30000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## License

Created and maintained by Ayantik Mallick.
