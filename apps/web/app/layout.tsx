import Copilot from './copilot'

export const metadata = { title: 'Overheard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Archivo for the extracted task — workmanlike, reads at four metres.
            Newsreader italic for the overheard sentence, because that half is
            somebody's actual voice and should not look like machine output. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@500&display=swap"
        />
      </head>
      <body style={{ margin: 0, background: '#0b0b0d', color: '#f4f3f1' }}>
        <Copilot>{children}</Copilot>
      </body>
    </html>
  )
}
