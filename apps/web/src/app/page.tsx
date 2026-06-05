import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';

/**
 * The public marketing homepage ("/"). A sales-oriented SaaS landing page with
 * a live 3D hero, stats, and feature highlights. Solutions, Pricing, and Plans
 * each live on their own route (/solutions, /pricing, /plans). The product
 * dashboard lives behind /dashboard and is unaffected by this page.
 */

const STATS = [
  { value: '70%', label: 'Tickets auto-resolved' },
  { value: '5×', label: 'Faster outreach' },
  { value: '24/7', label: 'Always-on agents' },
  { value: '40h', label: 'Saved per week' },
];

const FEATURES = [
  { icon: Zap, title: 'Deploy in minutes', desc: 'Connect your data, toggle a product, and your AI workforce is live — no engineering project.' },
  { icon: ShieldCheck, title: 'Enterprise-grade security', desc: 'Role-based permissions, org isolation, and full audit trails on every AI action.' },
  { icon: Clock, title: 'Works around the clock', desc: 'Your agents never sleep — handling support, knowledge, and sales 24/7.' },
  { icon: TrendingUp, title: 'Compounding ROI', desc: 'Every interaction trains your agents to be sharper, cheaper, and more on-brand.' },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden">
      <Navbar />

      {/* ---------------- HERO ---------------- */}
      <section
        id="home"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center"
      >
        {/* Hero background image */}
        <Image
          src="/hero.jpg"
          alt="AI automation network — neural agents connected to a central core"
          fill
          priority
          sizes="100vw"
          className="pointer-events-none -z-10 object-cover object-center opacity-90"
        />
        {/* Readability overlay: darken + fade the image edges into the page */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/40 to-background" />
        <div className="pointer-events-none absolute inset-0 -z-20 bg-aurora opacity-60" />

        <h1 className="animate-fade-up max-w-4xl bg-gradient-to-b from-white via-white to-white/50 bg-clip-text pt-6 text-5xl font-bold leading-[1.05] tracking-tight text-transparent sm:text-6xl md:text-7xl">
          Hire an AI workforce that
          <br className="hidden sm:block" /> never clocks out
        </h1>

        <p className="animate-fade-up mt-6 max-w-2xl text-lg font-medium text-white/90 [text-shadow:_0_1px_14px_rgb(0_0_0_/_70%)]">
          AISOLUTIONDESK unifies an AI Service Desk, Employee Assistant, Sales
          Agent, and Social Media manager into one platform — so your team ships
          more while doing less.
        </p>

        <div className="animate-fade-up mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/sign-up">
            <Button size="lg" className="group">
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/solutions">
            <Button size="lg" variant="outline">
              Explore solutions
            </Button>
          </Link>
        </div>

        <p className="animate-fade-up mt-6 text-xs text-muted-foreground">
          No credit card required · Live in minutes · Cancel anytime
        </p>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="relative border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-6 py-10 text-center">
              <div className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-bold text-transparent">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="relative border-y border-white/10 bg-white/[0.02] py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-medium uppercase tracking-wider text-primary">
              Why AISOLUTIONDESK
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Built to pay for itself
            </h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="relative px-6 pb-28">
        <div className="glass relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-8 py-16 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-70" />
          <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Put your AI workforce to work today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join the teams automating support, knowledge, sales, and social with
            one platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="group">
                Start free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <Footer />
    </div>
  );
}
