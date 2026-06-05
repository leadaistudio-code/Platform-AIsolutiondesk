import type { Metadata } from 'next';
import { Navbar } from '@/components/marketing/navbar';
import { PlansComparison } from '@/components/marketing/plans-comparison';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Plans · AISOLUTIONDESK',
  description:
    'Compare AISOLUTIONDESK plans feature by feature — Starter, Growth, and Enterprise.',
};

/**
 * The public Plans page ("/plans"). Renders the marketing chrome plus a
 * detailed feature-by-feature comparison table across every tier.
 */
export default function PlansPage() {
  return (
    <div className="relative overflow-x-hidden">
      <Navbar />
      <main className="pt-16">
        <PlansComparison />
      </main>
      <Footer />
    </div>
  );
}
