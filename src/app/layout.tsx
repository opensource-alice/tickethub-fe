import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/providers';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'TicketHub | Official Live Event Discovery & Tickets',
  description:
    'Discover world-class concerts, championship sporting events, Broadway theatre, and family shows with real-time seat availability powered by Ticketmaster Discovery API.',
  keywords: [
    'tickets',
    'concerts',
    'sports tickets',
    'broadway shows',
    'live events',
    'tour dates',
    'ticketmaster proxy',
  ],
  authors: [{ name: 'TicketHub Team' }],
  metadataBase: new URL('https://tickethub.app'),
  openGraph: {
    title: 'TicketHub | Discover & Book Live Entertainment Tickets',
    description:
      'Search live concerts, sports, theatre, and comedy shows with official seat verification.',
    url: 'https://tickethub.app',
    siteName: 'TicketHub',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'TicketHub Live Events',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TicketHub | Live Event Discovery',
    description: 'Find tickets to upcoming concerts, matches, and performances.',
    images: ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={plusJakartaSans.variable}>
      <body className="min-h-screen flex flex-col font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
