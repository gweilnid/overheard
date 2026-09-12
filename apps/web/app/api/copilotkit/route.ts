// SEAT 5 owns this file.
//
// CopilotKit 1.71 ships two generations side by side. This is the v1 path:
// copilotRuntimeNextJSAppRouterEndpoint + OpenAIAdapter, which takes a plain
// OpenAI client — so it runs on the same OpenRouter key as the extractor.
// Verified against node_modules, not the docs, which mix v1 and v2 freely.
import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime'
import { llm, MODEL } from '@/lib/llm'

const runtime = new CopilotRuntime()
const serviceAdapter = new OpenAIAdapter({ openai: llm, model: MODEL })

export async function POST(req: Request) {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  })
  return handleRequest(req)
}
