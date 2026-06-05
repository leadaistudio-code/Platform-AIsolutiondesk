'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  Ticket,
  MessageSquare,
  Send,
  Share2,
  Headset,
  Receipt,
  LineChart,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';

/**
 * The Solutions section. Each product card animates into view on scroll
 * (staggered), and on hover reveals an AI "scan line" sweep plus a rotating
 * conic-gradient glow border — a modern, automation-flavored motion language.
 */

interface Solution {
  icon: LucideIcon;
  name: string;
  tagline: string;
  desc: string;
  glow: string; // tailwind gradient stops for the ambient blob
  ring: string;
  iconColor: string;
  scan: string; // hex used for the scan line + conic border
}

const SOLUTIONS: Solution[] = [
  {
    icon: Ticket,
    name: 'AI Service Desk',
    tagline: 'IT support & incidents',
    desc: 'Auto-triage tickets, suggest resolutions, and deflect repetitive requests with an agent trained on your runbooks.',
    glow: 'from-cyan-500/25 to-blue-500/10',
    ring: 'ring-cyan-400/30',
    iconColor: 'text-cyan-300',
    scan: '#22d3ee',
  },
  {
    icon: MessageSquare,
    name: 'AI Employee Assistant',
    tagline: 'Internal knowledge',
    desc: 'A private ChatGPT over your docs, wikis, and policies — with memory, permissions, and source citations.',
    glow: 'from-violet-500/25 to-fuchsia-500/10',
    ring: 'ring-violet-400/30',
    iconColor: 'text-violet-300',
    scan: '#a855f7',
  },
  {
    icon: Send,
    name: 'AI Sales Agent',
    tagline: 'Outreach & pipeline',
    desc: 'Score leads, generate personalized outreach, draft proposals, and sync everything to your CRM automatically.',
    glow: 'from-indigo-500/25 to-purple-500/10',
    ring: 'ring-indigo-400/30',
    iconColor: 'text-indigo-300',
    scan: '#6366f1',
  },
  {
    icon: Share2,
    name: 'AI Social Media',
    tagline: 'Auto-post + approvals',
    desc: 'On-brand posts generated, queued through approval flows, and published across channels on your schedule.',
    glow: 'from-pink-500/25 to-rose-500/10',
    ring: 'ring-pink-400/30',
    iconColor: 'text-pink-300',
    scan: '#ec4899',
  },
  {
    icon: Headset,
    name: 'AI Customer Support',
    tagline: 'External CX & helpdesk',
    desc: 'Resolves customer conversations across chat, email, and messaging — deflecting FAQs, drafting replies, and escalating with full context to your helpdesk.',
    glow: 'from-emerald-500/25 to-teal-500/10',
    ring: 'ring-emerald-400/30',
    iconColor: 'text-emerald-300',
    scan: '#10b981',
  },
  {
    icon: Receipt,
    name: 'AI Finance Agent',
    tagline: 'AP, AR & expenses',
    desc: 'Reads and codes invoices, matches purchase orders, flags anomalies, automates expense categorization, and chases overdue payments so the books close faster.',
    glow: 'from-amber-500/25 to-orange-500/10',
    ring: 'ring-amber-400/30',
    iconColor: 'text-amber-300',
    scan: '#f59e0b',
  },
  {
    icon: LineChart,
    name: 'AI Finance Analysis',
    tagline: 'Reporting & forecasting',
    desc: 'Turns financial data into instant reports, cash-flow forecasts, and variance insights — ask in plain language and get the numbers and the why behind them.',
    glow: 'from-teal-500/25 to-cyan-500/10',
    ring: 'ring-teal-400/30',
    iconColor: 'text-teal-300',
    scan: '#2dd4bf',
  },
  {
    icon: Megaphone,
    name: 'AI Marketing & SEO',
    tagline: 'Content & growth',
    desc: 'Set your brand voice once, then generate SEO-optimized blogs, emails, and ads, research keywords, score drafts, and turn one piece into posts for every channel — a 5-hour task done in 15 minutes.',
    glow: 'from-orange-500/25 to-rose-500/10',
    ring: 'ring-orange-400/30',
    iconColor: 'text-orange-300',
    scan: '#fb923c',
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Solutions() {
  return (
    <section id="solutions" className="relative mx-auto max-w-7xl px-6 py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="text-sm font-medium uppercase tracking-wider text-primary">
          Solutions
        </span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Eight AI agents. One platform.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Turn on what you need today and add the rest as you grow. Every agent
          shares the same secure foundation.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="mt-16 grid gap-6 sm:grid-cols-2"
      >
        {SOLUTIONS.map((s) => (
          <motion.div
            key={s.name}
            variants={card}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="group relative overflow-hidden rounded-2xl"
          >
            {/* Rotating conic-gradient glow border, revealed on hover */}
            <span
              className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, ${s.scan}66 60deg, transparent 140deg, transparent 360deg)`,
                animation: 'spin 4s linear infinite',
              }}
            />

            {/* Card surface */}
            <div className="glass glass-hover relative h-full rounded-2xl p-8">
              {/* Ambient color blob */}
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${s.glow} blur-2xl transition-transform duration-500 group-hover:scale-125`}
              />

              {/* AI scan line that sweeps down on hover */}
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent, ${s.scan}, transparent)`,
                  animation: 'scan-down 2.2s ease-in-out infinite',
                  boxShadow: `0 0 12px ${s.scan}`,
                }}
              />

              <div
                className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5 ring-1 ${s.ring}`}
              >
                <s.icon className={`h-6 w-6 ${s.iconColor}`} />
                {/* Pulsing neural node on the icon */}
                <span
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
                  style={{ background: s.scan, boxShadow: `0 0 8px ${s.scan}` }}
                >
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: s.scan,
                      animation: 'ai-ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
                    }}
                  />
                </span>
              </div>

              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.tagline}
              </div>
              <h3 className="mt-1 text-2xl font-semibold">{s.name}</h3>
              <p className="mt-3 text-muted-foreground">{s.desc}</p>
              <Link
                href="/dashboard"
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary transition-all hover:gap-2"
              >
                Explore <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
