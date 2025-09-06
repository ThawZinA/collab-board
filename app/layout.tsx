import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Collaborative Whiteboard - Real-time Drawing & Collaboration",
  description:
    "A modern, real-time collaborative whiteboard tool built with Next.js. Draw, collaborate, and create together with advanced drawing tools and live collaboration features.",
  keywords: ["whiteboard", "collaboration", "drawing", "real-time", "canvas", "teamwork"],
  authors: [{ name: "Frontend Developer Portfolio" }],
  creator: "Frontend Developer",
  openGraph: {
    title: "Collaborative Whiteboard - Real-time Drawing & Collaboration",
    description: "A modern, real-time collaborative whiteboard tool with advanced drawing features.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Collaborative Whiteboard",
    description: "Real-time collaborative drawing and whiteboard tool",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
