import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

export const dynamic = 'force-dynamic'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Pott Dashboard',
  description: 'Sales analytics for Pott Glasses',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 font-sans antialiased">{children}</body>
    </html>
  )
}
