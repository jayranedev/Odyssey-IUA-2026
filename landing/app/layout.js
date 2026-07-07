import { Inter, JetBrains_Mono } from 'next/font/google';

import './globals.css';
import { site } from '../lib/site';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(site.siteUrl),
  title: 'JugaadGPT — AI jugaad solutions for real Indian constraints',
  description:
    'Tell JugaadGPT your problem, budget in ₹, and what\'s lying around — get a buildable fix with a rupee bill-of-materials.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'JugaadGPT',
    title: 'JugaadGPT — AI jugaad solutions for real Indian constraints',
    description:
      '₹-budget builds grounded in real Indian jugaad. Practical, buildable, and constraint-first.',
    url: site.siteUrl,
    images: [
      {
        url: new URL(site.ogImage, site.siteUrl).toString(),
        width: 1200,
        height: 630,
        alt: 'JugaadGPT og image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JugaadGPT — AI jugaad solutions for real Indian constraints',
    description:
      '₹-budget builds grounded in real Indian jugaad. Practical, buildable, and constraint-first.',
    images: [new URL(site.ogImage, site.siteUrl).toString()],
  },
  icons: {
    icon: '/assets/favicon-32.png',
    apple: '/assets/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#F4C61E',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}