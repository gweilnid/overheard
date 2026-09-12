import Copilot from './copilot'

export const metadata = { title: 'Overheard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0d0d0f', color: '#f2f2f2' }}>
        <Copilot>{children}</Copilot>
      </body>
    </html>
  )
}
