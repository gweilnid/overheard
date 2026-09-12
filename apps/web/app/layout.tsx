import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = { title: 'Overheard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // TODO SEAT 5: the <CopilotKit runtimeUrl="/api/copilotkit"> provider wraps
  // {children} here, once the board exists.
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body style={{ margin: 0, background: '#0d0d0f', color: '#f2f2f2' }}>
        {children}
      </body>
    </html>
  )
}
