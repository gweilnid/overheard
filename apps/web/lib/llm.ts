// OpenRouter client for SEAT 5's CopilotKit runtime (OpenAIAdapter takes a plain
// OpenAI client). The extractor does NOT use this — lib/extract.ts calls
// OpenRouter over fetch directly and validates with Zod.
import OpenAI from 'openai'

export const MODEL = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4.1-mini'

// Points at our own proxy, not OpenRouter. See app/api/llm/[...path]/route.ts —
// the adapter demands a max_completion_tokens a free-tier key cannot afford and
// offers no way to set it, so the proxy clamps it on the way through.
const ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000'

export const llm = new OpenAI({
  baseURL: `${ORIGIN}/api/llm`,
  apiKey: process.env.OPENROUTER_API_KEY,
})
