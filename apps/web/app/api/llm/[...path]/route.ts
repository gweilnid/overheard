// Thin OpenRouter proxy that exists for exactly one reason.
//
// CopilotKit's OpenAIAdapter builds its own request from the client's baseURL and
// apiKey — it never calls the client's methods — and it asks for a huge
// max_completion_tokens with no option to change it. OpenRouter then refuses:
//   "You requested up to 65536 tokens, but can only afford 23896"
// The provider only forwards `temperature`, so there is no client-side lever.
// Pointing the adapter's baseURL here is the one place the value can be clamped.
import { NextResponse } from 'next/server'

const UPSTREAM = 'https://openrouter.ai/api/v1'
const MAX_OUTPUT = 1500

export async function POST(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const route = path.join('/')

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  // Clamp only the keys already present — the Responses API rejects
  // max_completion_tokens outright, so injecting every spelling breaks the call.
  const keys = ['max_output_tokens', 'max_completion_tokens', 'max_tokens'] as const
  const present = keys.filter(k => k in body)
  for (const key of present) {
    const v = body[key]
    if (typeof v !== 'number' || v > MAX_OUTPUT) body[key] = MAX_OUTPUT
  }
  if (!present.length) {
    body[route.endsWith('responses') ? 'max_output_tokens' : 'max_tokens'] = MAX_OUTPUT
  }

  const upstream = await fetch(`${UPSTREAM}/${route}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  // Stream it back untouched — the adapter expects SSE.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}
