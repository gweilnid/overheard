import Copilot from './copilot'

export const metadata = { title: 'Overheard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Pairing from the ui-ux-pro-max design system for this product type:
            Fira Sans / Fira Code — dashboard, data, precise. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body style={{ margin: 0 }}>
        <Copilot>{children}</Copilot>
      </body>
    </html>
  )
}
