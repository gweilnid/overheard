'use client'
// SEAT 5 owns this file. Wraps the board so the chat can see and act on state.
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'

// The client calls new URL(runtimeUrl) with no base, so a relative path throws
// "Failed to construct 'URL': Invalid URL" and every message fails silently.
// Never gate the provider behind a state flag — children calling useCopilotReadable
// would mount outside it on the first render and throw.
const runtimeUrl =
  typeof window === 'undefined'
    ? '/api/copilotkit'
    : `${window.location.origin}/api/copilotkit`

export default function Copilot({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl={runtimeUrl}>
      <CopilotSidebar
        labels={{
          title: 'Ask about the group',
          initial:
            'I can see every commitment and meeting in the group.\n\n' +
            'Try: "what is Mehmet on the hook for?" or "close the pricing numbers"',
        }}
        defaultOpen={false}
        clickOutsideToClose={false}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  )
}
