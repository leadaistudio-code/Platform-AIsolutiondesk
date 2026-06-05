'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  MessageSquare,
  Send,
  Share2,
  Headset,
  Receipt,
  LineChart,
  Megaphone,
  Check,
  ArrowRight,
  Sparkles,
  Terminal,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Interactive "explainer" for the Solutions page. A customer picks an agent and
 * sees, in plain language: what it does, the features, the payoff (benefit
 * metrics), and an animated quick demo (a scripted input → AI output reveal).
 * The goal is that a non-technical visitor instantly "gets it" and wants a demo.
 */

interface Agent {
  name: string;
  icon: LucideIcon;
  color: string; // accent hex
  oneLiner: string;
  features: string[];
  benefits: { metric: string; label: string }[];
  demo: { input: string; output: string[] };
}

const AGENTS: Agent[] = [
  {
    name: 'AI Service Desk',
    icon: Ticket,
    color: '#22d3ee',
    oneLiner: 'Auto-triages IT tickets, suggests fixes, and deflects repetitive requests — trained on your runbooks.',
    features: [
      'Auto-categorizes & prioritizes every ticket',
      'Suggests step-by-step resolutions from your docs',
      'Deflects repeat questions before they reach an agent',
      'Routes and escalates with full context',
    ],
    benefits: [
      { metric: '70%', label: 'tickets auto-resolved' },
      { metric: '24/7', label: 'always-on triage' },
      { metric: '40h', label: 'saved per week' },
    ],
    demo: {
      input: "Ticket: “VPN keeps disconnecting every 10 minutes since this morning's update.”",
      output: [
        'Category: Network · Priority: High',
        'Likely cause: VPN client v4.2 — known issue (KB-1183)',
        'Suggested fix: roll back to v4.1 or apply the patch',
        'Drafted reply sent · escalated to Network team',
      ],
    },
  },
  {
    name: 'AI Employee Assistant',
    icon: MessageSquare,
    color: '#a855f7',
    oneLiner: "A private ChatGPT over your company's docs, wikis, and policies — with source citations.",
    features: [
      'Answers from your internal knowledge, not the open web',
      'Cites the exact source document',
      'Respects team permissions and access',
      'Remembers context across conversations',
    ],
    benefits: [
      { metric: '<5s', label: 'to an answer' },
      { metric: '3,910', label: 'questions / month' },
      { metric: '0', label: 'docs to dig through' },
    ],
    demo: {
      input: 'Employee: “How many vacation days do I get in my second year?”',
      output: [
        "You're entitled to 20 paid vacation days in year two.",
        'Source: HR Handbook 2026 → Leave Policy, p.12',
        'Unused days roll over up to 5.',
      ],
    },
  },
  {
    name: 'AI Sales Agent',
    icon: Send,
    color: '#6366f1',
    oneLiner: 'Scores leads, writes personalized outreach, drafts proposals, and syncs your CRM automatically.',
    features: [
      'Scores & qualifies leads automatically',
      'Generates personalized outreach per prospect',
      'Drafts proposals in your template',
      'Syncs everything to your CRM',
    ],
    benefits: [
      { metric: '5×', label: 'faster outreach' },
      { metric: '₹10Cr', label: 'pipeline tracked' },
      { metric: 'min', label: 'not hours, per proposal' },
    ],
    demo: {
      input: 'Lead: Priya Sharma — VP Engineering @ Globex (500 employees)',
      output: [
        'Score: 88/100 — strong fit (size + role + stack)',
        'Angle: scaling support without adding headcount',
        "Drafted email: “Hi Priya, noticed Globex is scaling fast…”",
        'Logged to CRM · follow-up scheduled in 3 days',
      ],
    },
  },
  {
    name: 'AI Social Media',
    icon: Share2,
    color: '#ec4899',
    oneLiner: 'Generates on-brand posts, routes them through approvals, and publishes on your schedule.',
    features: [
      'Generates on-brand posts for each platform',
      'Approval workflow before anything goes live',
      'Schedules and auto-publishes',
      'Tracks engagement over time',
    ],
    benefits: [
      { metric: '10×', label: 'more content' },
      { metric: '24/7', label: 'scheduling' },
      { metric: '1-click', label: 'approvals' },
    ],
    demo: {
      input: 'Topic: “Announce our new AI Finance agent”',
      output: [
        "LinkedIn: “Meet your AI CFO-in-a-box 🤖…” (3 paragraphs + hashtags)",
        'X: “Close the books faster — our AI Finance agent is live 🚀”',
        'Status: queued for approval → scheduled Tue 9am',
      ],
    },
  },
  {
    name: 'AI Customer Support',
    icon: Headset,
    color: '#10b981',
    oneLiner: 'Resolves customer chats and emails, deflects FAQs, and escalates with full context.',
    features: [
      'Answers across chat, email & messaging',
      'Deflects FAQs instantly, 24/7',
      'Drafts on-brand replies for your agents',
      'Escalates with a full summary',
    ],
    benefits: [
      { metric: '60%', label: 'conversations auto-resolved' },
      { metric: '28s', label: 'avg first response' },
      { metric: '4.7/5', label: 'customer satisfaction' },
    ],
    demo: {
      input: "Customer: “Where's my order #4821? It's been a week.”",
      output: [
        'Looked up order #4821 — shipped, in transit',
        "Drafted reply: “Hi! It shipped Mon, arrives Thu. Track: …”",
        'Tone matched to brand · sent · marked resolved',
      ],
    },
  },
  {
    name: 'AI Finance Agent',
    icon: Receipt,
    color: '#f59e0b',
    oneLiner: 'Reads and codes invoices, automates expenses, and chases overdue payments.',
    features: [
      'Captures & codes invoices, matches POs',
      'Flags anomalies & duplicate charges',
      'Automates expense categorization',
      'Sends polite collections reminders',
    ],
    benefits: [
      { metric: '88%', label: 'invoices auto-coded' },
      { metric: 'hrs', label: 'to close, not days' },
      { metric: '₹35L', label: 'receivables recovered' },
    ],
    demo: {
      input: 'Invoice: Acme Cloud — ₹4,00,000, due in 30 days',
      output: [
        'Vendor matched · GL: Software/SaaS · PO #PO-2231 ✓',
        'No anomalies · within budget',
        'Queued for approval · payment scheduled',
        'Reminder set if unpaid by due date',
      ],
    },
  },
  {
    name: 'AI Finance Analysis',
    icon: LineChart,
    color: '#2dd4bf',
    oneLiner: 'Turns your numbers into instant reports, forecasts, and plain-language insights.',
    features: [
      'Live KPIs: MRR, burn, runway, margin',
      'AI reports with highlights, risks & recommendations',
      '6-month forecasts with scenarios',
      'Ask in plain language, get the “why”',
    ],
    benefits: [
      { metric: 'instant', label: 'board-ready reports' },
      { metric: '94%', label: 'forecast accuracy' },
      { metric: 'min', label: 'not days' },
    ],
    demo: {
      input: 'Question: “How are we doing this quarter?”',
      output: [
        'MRR ₹1.9Cr · +6% MoM · margin 18.1%',
        'Highlight: revenue outpacing expenses 4 months straight',
        'Risk: margin still thin — watch infra spend',
        'Runway: profitable · cash ₹10Cr',
      ],
    },
  },
  {
    name: 'AI Marketing & SEO',
    icon: Megaphone,
    color: '#fb923c',
    oneLiner: 'Generates SEO content in your brand voice and repurposes it across every channel.',
    features: [
      'Generate blogs, emails, ads & landing pages',
      'SEO keyword research + draft scoring',
      'Repurpose one asset into many channels',
      'On-brand via your saved brand voice',
    ],
    benefits: [
      { metric: '5h→15m', label: 'per blog post' },
      { metric: '5-10×', label: 'more content' },
      { metric: '1', label: 'person = a whole team' },
    ],
    demo: {
      input: 'Brief: “Blog post — how AI service desks cut ticket volume”',
      output: [
        "Title: “How AI Service Desks Cut Ticket Volume by 60%”",
        'SEO score: 86/100 · meta + keywords generated',
        'Repurposed → LinkedIn post, X thread, newsletter',
        'Saved to your content library',
      ],
    },
  },
];

export function SolutionsExplorer() {
  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [nonce, setNonce] = useState(0);
  const agent = AGENTS[active]!;
  const Icon = agent.icon;

  // Re-run the demo reveal whenever the selected agent (or replay nonce) changes.
  useEffect(() => {
    setRevealed(0);
    const timers = agent.demo.output.map((_, i) =>
      setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 450 * (i + 1)),
    );
    return () => timers.forEach(clearTimeout);
  }, [active, nonce, agent.demo.output]);

  const done = revealed >= agent.demo.output.length;

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-primary">
          See it in action
        </span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          What each agent does — in 10 seconds
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Pick an agent to see what it does, why it pays off, and a live example.
        </p>
      </div>

      {/* Agent selector pills */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {AGENTS.map((a, i) => {
          const on = i === active;
          const PillIcon = a.icon;
          return (
            <button
              key={a.name}
              onClick={() => setActive(i)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all',
                on
                  ? 'text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
              style={
                on
                  ? { borderColor: a.color, background: `${a.color}1a` }
                  : undefined
              }
            >
              <PillIcon className="h-4 w-4" style={{ color: a.color }} />
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Detail + demo */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Left: what it does + benefits */}
        <div className="glass rounded-2xl p-7">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl ring-1"
              style={{ background: `${agent.color}1a`, color: agent.color, borderColor: `${agent.color}55` }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">{agent.name}</h3>
          </div>
          <p className="mt-3 text-muted-foreground">{agent.oneLiner}</p>

          <div className="mt-6 space-y-2.5">
            {agent.features.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: agent.color }} />
                <span className="text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {agent.benefits.map((b) => (
              <div key={b.label} className="rounded-xl border border-border bg-foreground/[0.03] p-3 text-center">
                <div className="text-lg font-bold" style={{ color: agent.color }}>
                  {b.metric}
                </div>
                <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  {b.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: animated quick demo */}
        <div className="glass flex flex-col rounded-2xl p-7">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Terminal className="h-4 w-4" /> Quick demo
          </div>

          {/* Input */}
          <div className="rounded-xl border border-border bg-foreground/[0.03] p-3 text-sm">
            <span className="text-muted-foreground">{agent.demo.input}</span>
          </div>

          {/* AI working / output */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" style={{ color: agent.color }} />
            {done ? 'AI completed' : 'AI working…'}
          </div>

          <div className="mt-2 flex-1 space-y-2">
            {agent.demo.output.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-300',
                  i < revealed ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
                )}
                style={{ background: `${agent.color}12` }}
              >
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: agent.color }} />
                <span className="text-foreground/90">{line}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setNonce((n) => n + 1)}
            className="mt-4 self-start text-xs text-muted-foreground hover:text-foreground"
          >
            ↻ Replay demo
          </button>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Like what you see? Try it free, or book a guided demo with our team.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/sign-up">
            <Button size="lg" className="group">
              Start free — book a demo
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
  );
}
