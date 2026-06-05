import type { Metadata } from 'next';
import { Navbar } from '@/components/marketing/navbar';
import { Solutions } from '@/components/marketing/solutions';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Solutions · AISOLUTIONDESK',
  description:
    'Four AI agents on one platform — AI Service Desk, Employee Assistant, Sales Agent, and Social Media manager.',
};

/**
 * The public Solutions page ("/solutions"). Renders the marketing chrome plus
 * the shared Solutions section, with top padding so the content clears the
 * fixed navbar.
 */
export default function SolutionsPage() {
  return (
    <div className="relative overflow-x-hidden">
      <Navbar />
      <main className="pt-16">
        <Solutions />
      </main>
      <Footer />
    </div>
  );
}
