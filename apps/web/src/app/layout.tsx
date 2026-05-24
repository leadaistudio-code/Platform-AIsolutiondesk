import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AISOLUTIONDESK — The AI Workforce Platform',
  description:
    'Automate support, internal knowledge, and sales with enterprise AI agents.',
};

/**
 * The root layout wraps every page. We force dark mode via `className="dark"`
 * on <html> for the premium, futuristic default look.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
