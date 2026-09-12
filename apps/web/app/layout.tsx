import Copilot from './copilot'

export const metadata = { title: 'Overheard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fraunces carries the spoken line — its optical sizing and `wonk` axis give
            quoted speech a voice. Archivo handles structure. JetBrains Mono is for
            things that are literally recorded values: times, counts, names. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@1,9..144,400;1,9..144,500&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body style={{ margin: 0 }}>
        <Copilot>{children}</Copilot>
      </body>
    </html>
  )
}
