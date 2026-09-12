// OpenRouter client. Everything that talks to a model goes through here.
import OpenAI from 'openai'

export const MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4.5'

export const llm = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Structured-output support on OpenRouter is per PROVIDER, not per model — the
// same model is served by several providers and only some honour json_schema.
// Without this, requests get silently routed to one that ignores the schema and
// you get prose back instead of JSON.
export const REQUIRE_STRUCTURED = {
  provider: { require_parameters: true },
} as const
