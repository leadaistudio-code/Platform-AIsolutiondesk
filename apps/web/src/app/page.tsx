import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Ticket,
  Headset,
  Send,
  Megaphone,
  Receipt,
  Clock,
  Plug,
  MousePointerClick,
  Rocket,
  Quote,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';

/**
 * The public marketing homepage ("/"). A conversion-focused SaaS landing page:
 * a magnetic hero with dual "demo / buy" CTAs, quantified benefits, the pain
 * points it solves, an ROI comparison, and social proof. Solutions, Pricing,
 * and Plans live on their own routes. The dashboard lives behind /dashboard.
 */

const STATS = [
  { value: '70%', label: 'Tickets auto-resolved' },
  { value: '40h', label: 'Saved per week' },
  { value: '5×', label: 'Faster outreach' },
  { value: '24/7', label: 'Always-on agents' },
];

const PAINS = [
  { title: 'Costs climb faster than output', desc: 'Headcount and SaaS bills keep growing, but results don’t keep pace.' },
  { title: 'You can’t hire fast enough', desc: 'Critical work stalls waiting on roles you can’t fill — or afford.' },
  { title: 'Teams drown in busywork', desc: 'Tickets, follow-ups, invoices, content — still done by hand, all day.' },
  { title: 'Customers expect instant, 24/7', desc: 'Slow replies quietly cost you trust, renewals, and revenue.' },
];

const BENEFITS = [
  { icon: Ticket, metric: '70%', label: 'of tickets auto-resolved', desc: 'AI Service Desk triages and resolves repetitive IT requests for you.' },
  { icon: Headset, metric: '60%', label: 'of customer chats deflected', desc: 'AI Customer Support answers FAQs across channels, 24/7.' },
  { icon: Send, metric: '5×', label: 'faster sales outreach', desc: 'AI Sales scores leads and writes personalized outreach & proposals.' },
  { icon: Megaphone, metric: '5h → 15m', label: 'to publish content', desc: 'AI Marketing generates SEO content and repurposes it everywhere.' },
  { icon: Receipt, metric: '88%', label: 'of invoices auto-coded', desc: 'AI Finance captures invoices and closes the books faster.' },
  { icon: Clock, metric: '40h+', label: 'saved every week', desc: 'Across every department — work that used to take a full team.' },
];

const STEPS = [
  { icon: Plug, title: 'Connect your data', desc: 'Docs, CRM, inbox, and finances — in a few clicks. No migration project.' },
  { icon: MousePointerClick, title: 'Switch on the agents you need', desc: 'Turn on one today, add the rest as you grow. No engineering required.' },
  { icon: Rocket, title: 'Go live in minutes', desc: 'Your AI workforce starts working 24/7 — sharper and cheaper over time.' },
];

const OLD_WAY = [
  { item: 'Extra support reps', cost: '₹40,000+/mo' },
  { item: 'Freelance content & SEO', cost: '₹30,000+/mo' },
  { item: 'Bookkeeper / AP clerk', cost: '₹30,000+/mo' },
  { item: 'SDR for outreach', cost: '₹50,000+/mo' },
];

const TESTIMONIALS = [
  { quote: 'We auto-resolve 70% of tickets now — it’s like adding five support reps overnight.', who: 'Head of IT, B2B SaaS (220 employees)' },
  { quote: 'Our content went from 2 posts a month to 12 — with the exact same team.', who: 'Marketing Lead, fintech' },
  { quote: 'Month-end close dropped from a week to a single day.', who: 'Finance Manager, e-commerce' },
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
        <Image
          src="/hero.jpg"
          alt="AI automation network — neural agents connected to a central core"
          fill
          priority
          sizes="100vw"
          className="pointer-events-none -z-10 object-cover object-center opacity-90"
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-black/40" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="pointer-events-none absolute inset-0 -z-20 bg-aurora opacity-60" />

        <h1 className="animate-fade-up max-w-4xl bg-gradient-to-b from-white via-white to-white/60 bg-clip-text pt-6 text-5xl font-bold leading-[1.05] tracking-tight text-transparent sm:text-6xl md:text-7xl">
          Hire an AI workforce that
          <br className="hidden sm:block" /> never clocks out
        </h1>

        <p className="animate-fade-up mt-6 max-w-2xl text-lg font-medium text-white/90 [text-shadow:_0_1px_14px_rgb(0_0_0_/_70%)]">
          Automate support, sales, finance, and marketing with AI agents that
          work 24/7 — cut operating costs up to <span className="font-bold text-white">60%</span> and
          save your team <span className="font-bold text-white">40+ hours</span> every week.
        </p>

        <div className="animate-fade-up mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/sign-up">
            <Button size="lg" className="group">
              Start free trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/solutions">
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              See a live demo
            </Button>
          </Link>
        </div>

        <p className="animate-fade-up mt-6 text-xs text-white/70">
          3-day free trial · No credit card required · Live in minutes · Cancel anytime
        </p>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="relative border-y border-border bg-foreground/[0.03]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-6 py-10 text-center">
              <div className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-4xl font-bold text-transparent">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- PAIN POINTS ---------------- */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            Sound familiar?
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            The work is growing. Your team isn’t.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every team feels the same squeeze. Here’s what’s quietly draining
            your time and budget today.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map((p) => (
            <div key={p.title} className="glass rounded-2xl p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-400/30">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-lg">
          <span className="font-semibold">There’s a faster, cheaper way</span> — give
          the repetitive work to AI agents that never sleep.
        </p>
      </section>

      {/* ---------------- QUANTIFIED BENEFITS ---------------- */}
      <section className="relative border-y border-border bg-foreground/[0.03] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-medium uppercase tracking-wider text-primary">
              Measurable results
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              One platform. Eight AI employees. Real ROI.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Each agent handles the repetitive work of a whole department — with
              numbers you can take to your CFO.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.label} className="glass glass-hover rounded-2xl p-7">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">{b.metric}</div>
                <div className="mt-1 font-semibold">{b.label}</div>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/solutions">
              <Button size="lg" variant="outline" className="group">
                See every agent in action
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            Live in minutes
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            No project. No engineers. No risk.
          </h2>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/30">
                  {i + 1}
                </span>
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- ROI / PAYS FOR ITSELF ---------------- */}
      <section className="relative border-y border-border bg-foreground/[0.03] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-medium uppercase tracking-wider text-primary">
              Pays for itself
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Replace a stack of tools and hires
            </h2>
          </div>

          <div className="mt-14 grid items-stretch gap-6 md:grid-cols-2">
            {/* Old way */}
            <div className="glass rounded-2xl p-7">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                The old way
              </h3>
              <ul className="mt-5 space-y-3">
                {OLD_WAY.map((o) => (
                  <li key={o.item} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{o.item}</span>
                    <span className="font-medium">{o.cost}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border pt-4 text-right">
                <span className="text-2xl font-bold">₹1,50,000+</span>
                <span className="text-muted-foreground"> / month</span>
              </div>
            </div>

            {/* New way */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-primary/10 to-transparent p-7">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-50" />
              <h3 className="text-sm font-medium uppercase tracking-wider text-primary">
                With AISOLUTIONDESK
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                {['All 8 AI agents on one platform', 'Up to unlimited AI actions', 'Live 24/7 — no sick days, no ramp', 'Enterprise security & audit trails'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border pt-4">
                <span className="text-muted-foreground">from </span>
                <span className="text-2xl font-bold">₹3,999</span>
                <span className="text-muted-foreground"> / month · 3-day free trial</span>
              </div>
              <Link href="/sign-up" className="mt-5 block">
                <Button className="w-full group">
                  Start free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SOCIAL PROOF ---------------- */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Teams ship more — with less
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.who} className="glass rounded-2xl p-7">
              <Quote className="h-6 w-6 text-primary/60" />
              <p className="mt-3 text-sm leading-relaxed">{t.quote}</p>
              <p className="mt-4 text-xs font-medium text-muted-foreground">— {t.who}</p>
            </div>
          ))}
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
            Start free in minutes, or get a guided walkthrough from our team. No
            credit card. Cancel anytime.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="group">
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/solutions">
              <Button size="lg" variant="outline">
                Book a demo
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Enterprise-grade security</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> 3-day free trial</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Live in minutes</span>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <Footer />
    </div>
  );
}
