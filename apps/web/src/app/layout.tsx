import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { ChatWidget } from '@/components/marketing/chat-widget';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AISOLUTIONDESK — AI Workforce Platform',
  description:
    'Automate support, internal knowledge, and sales with enterprise AI agents.',
};

/**
 * The root layout wraps every page. The theme (light/dark) is managed by
 * next-themes, which sets the matching class on <html> — defaulting to dark for
 * the premium, futuristic look. `suppressHydrationWarning` is required because
 * that class is applied on the client before React hydrates.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <AppProviders>
          {children}
          <ChatWidget />
        </AppProviders>
      </body>
    </html>
  );
}
