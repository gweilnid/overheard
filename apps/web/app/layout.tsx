import Copilot from './copilot'

export const metadata = { title: 'Overheard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Pairing 20 "Premium Sans" from the ui-ux-pro-max typography catalogue.
            DM Sans / DM Mono — modern without being Inter or Space Grotesk, both
            of which are the house faces of generated UI. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
        />
      </head>
      <body style={{ margin: 0 }}>
        <Copilot>{children}</Copilot>
      </body>
    </html>
  )
}
