import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AUTO - Automation Platform',
  description: 'Web-based automation platform for data extraction and monitoring',
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
