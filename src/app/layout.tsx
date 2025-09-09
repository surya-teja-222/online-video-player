import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://video-player-rho-orcin.vercel.app'),
  title: {
    default: 'Online Video Player - Stream Videos Seamlessly',
    template: '%s | Online Video Player'
  },
  description: 'Watch and stream videos online with our advanced video player. Support for multiple formats including MP4, WebM, and HLS streaming. Fast, responsive, and user-friendly.',
  keywords: ['video player', 'online streaming', 'HLS', 'MP4', 'WebM', 'video streaming', 'media player', 'watch videos online'],
  authors: [{ name: 'Surya' }],
  creator: 'Online Video Player',
  publisher: 'Online Video Player',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Online Video Player - Stream Videos Seamlessly',
    description: 'Watch and stream videos online with our advanced video player. Support for multiple formats including MP4, WebM, and HLS streaming.',
    url: 'https://video-player-rho-orcin.vercel.app',
    siteName: 'Online Video Player',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://video-player-rho-orcin.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Online Video Player Preview',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Online Video Player - Stream Videos Seamlessly',
    description: 'Watch and stream videos online with our advanced video player.',
    images: ['https://video-player-rho-orcin.vercel.app/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  alternates: {
    canonical: 'https://video-player-rho-orcin.vercel.app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
