import type { Metadata } from 'next';
import { Navbar } from '@/components/marketing/navbar';
import { Pricing } from '@/components/marketing/pricing';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Pricing · AISOLUTIONDESK',
  description:
    'Simple, scalable pricing. Every paid plan starts with a 3-day free trial — cancel anytime.',
};

/**
 * The public Pricing page ("/pricing"). Renders the marketing chrome plus the
 * shared Pricing section (price cards + monthly/annual toggle).
 */
export default function PricingPage() {
  return (
    <div className="relative overflow-x-hidden">
      <Navbar />
      <main className="pt-16">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
