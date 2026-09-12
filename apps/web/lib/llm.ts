// OpenRouter client for SEAT 5's CopilotKit runtime (OpenAIAdapter takes a plain
// OpenAI client). The extractor does NOT use this — lib/extract.ts calls
// OpenRouter over fetch directly and validates with Zod.
import OpenAI from 'openai'

export const MODEL = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4.1-mini'

export const llm = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})
