import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SQL to API Builder',
  description: 'Build complex SQL queries and transform them into production-ready API endpoints',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai+Looped:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark-bg text-gray-100 antialiased" style={{ fontFamily: '"Noto Sans Thai Looped", sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
