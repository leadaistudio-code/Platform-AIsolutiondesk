import Link from 'next/link';
import {
  Headset,
  Receipt,
  LineChart,
  Megaphone,
  Inbox,
  BookOpen,
  Wallet,
  TrendingUp,
  PenTool,
  Search,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Reusable workspace scaffold for the newer AI agents (Customer Support,
 * Finance, Finance Analysis, Marketing & SEO). Each route passes a moduleKey +
 * view; all the copy/metrics live here so the per-route page files stay thin.
 *
 * The metrics are representative sample data (like the rest of the dashboard)
 * until each agent's backend module is wired up.
 */

type ModuleKey =
  | 'customer-support'
  | 'finance'
  | 'finance-analysis'
  | 'marketing-seo';

interface Kpi {
  label: string;
  value: string;
}

interface Capability {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface View {
  /** route slug after the base, '' for the overview */
  slug: string;
  heading: string;
  blurb: string;
}

interface ModuleConfig {
  name: string;
  tagline: string;
  icon: LucideIcon;
  base: string;
  intro: string;
  kpis: Kpi[];
  capabilities: Capability[];
  views: View[];
}

const MODULES: Record<ModuleKey, ModuleConfig> = {
  'customer-support': {
    name: 'AI Customer Support',
    tagline: 'External CX & helpdesk',
    icon: Headset,
    base: '/customer-support',
    intro:
      'Resolve customer conversations across chat, email, and messaging — deflecting FAQs, drafting replies, and escalating with full context to your helpdesk.',
    kpis: [
      { label: 'Conversations today', value: '342' },
      { label: 'Auto-resolved', value: '61%' },
      { label: 'Avg. first response', value: '28s' },
      { label: 'CSAT', value: '4.7 / 5' },
    ],
    capabilities: [
      { icon: Inbox, title: 'Unified inbox', desc: 'Chat, email, and WhatsApp conversations in one queue with AI draft replies.' },
      { icon: Sparkles, title: 'FAQ deflection', desc: 'Instantly answers repetitive questions from your knowledge base, 24/7.' },
      { icon: ShieldCheck, title: 'Context-rich escalation', desc: 'Hands off to a human with a full summary and suggested next steps.' },
    ],
    views: [
      { slug: '', heading: 'Overview', blurb: 'How your customer support agent is performing.' },
      { slug: 'conversations', heading: 'Conversations', blurb: 'Live and recent customer conversations across every channel.' },
      { slug: 'knowledge', heading: 'Knowledge Base', blurb: 'The articles and macros the agent draws answers from.' },
    ],
  },
  finance: {
    name: 'AI Finance Agent',
    tagline: 'AP, AR & expenses',
    icon: Receipt,
    base: '/finance',
    intro:
      'Reads and codes invoices, matches purchase orders, flags anomalies, automates expense categorization, and chases overdue payments so the books close faster.',
    kpis: [
      { label: 'Invoices processed', value: '1,284' },
      { label: 'Pending approval', value: '23' },
      { label: 'Auto-coded', value: '88%' },
      { label: 'Overdue AR', value: '$42k' },
    ],
    capabilities: [
      { icon: Receipt, title: 'Invoice capture', desc: 'Extracts line items, matches POs, and codes to the right GL account.' },
      { icon: Wallet, title: 'Expense automation', desc: 'Categorizes expenses and flags policy violations before they post.' },
      { icon: TrendingUp, title: 'Collections', desc: 'Sends polite, on-brand reminders to bring down overdue receivables.' },
    ],
    views: [
      { slug: '', heading: 'Overview', blurb: 'Your accounts-payable and receivable at a glance.' },
      { slug: 'invoices', heading: 'Invoices', blurb: 'Captured invoices, approval status, and PO matches.' },
      { slug: 'expenses', heading: 'Expenses', blurb: 'Categorized expenses and flagged policy exceptions.' },
    ],
  },
  'finance-analysis': {
    name: 'AI Finance Analysis',
    tagline: 'Reporting & forecasting',
    icon: LineChart,
    base: '/finance-analysis',
    intro:
      'Turns financial data into instant reports, cash-flow forecasts, and variance insights — ask in plain language and get the numbers and the why behind them.',
    kpis: [
      { label: 'MRR', value: '$210k' },
      { label: 'Burn rate', value: '$85k / mo' },
      { label: 'Runway', value: '18 mo' },
      { label: 'Forecast accuracy', value: '94%' },
    ],
    capabilities: [
      { icon: LineChart, title: 'Instant reports', desc: 'Ask in plain language; get P&L, cash-flow, and cohort views on demand.' },
      { icon: TrendingUp, title: 'Forecasting', desc: 'Projects revenue, burn, and runway with scenario modeling.' },
      { icon: Sparkles, title: 'Variance insights', desc: 'Explains what moved vs. plan and why, before the meeting.' },
    ],
    views: [
      { slug: '', heading: 'Overview', blurb: 'Key financial metrics and trends.' },
      { slug: 'reports', heading: 'Reports', blurb: 'Generated P&L, cash-flow, and custom reports.' },
      { slug: 'forecasts', heading: 'Forecasts', blurb: 'Revenue, burn, and runway projections with scenarios.' },
    ],
  },
  'marketing-seo': {
    name: 'AI Marketing & SEO',
    tagline: 'Content & growth',
    icon: Megaphone,
    base: '/marketing',
    intro:
      'Generates on-brand SEO blog posts, email campaigns, and ad copy — repurposing one asset into ten and extending your social agent into a full marketing team.',
    kpis: [
      { label: 'Content pieces', value: '128' },
      { label: 'Organic traffic', value: '+34%' },
      { label: 'Keywords tracked', value: '1,920' },
      { label: 'Avg. position', value: '8.3' },
    ],
    capabilities: [
      { icon: PenTool, title: 'Content studio', desc: 'Drafts SEO blogs, emails, and ad copy on-brand from a single brief.' },
      { icon: Search, title: 'SEO planner', desc: 'Finds keyword opportunities and builds topic clusters that rank.' },
      { icon: Sparkles, title: 'Repurposing', desc: 'Turns one asset into posts, threads, and newsletters automatically.' },
    ],
    views: [
      { slug: '', heading: 'Overview', blurb: 'Content output and organic growth at a glance.' },
      { slug: 'content', heading: 'Content Studio', blurb: 'Drafts and published pieces across every channel.' },
      { slug: 'seo', heading: 'SEO Planner', blurb: 'Keyword opportunities and topic clusters to target.' },
    ],
  },
};

export function AgentModule({
  moduleKey,
  view = '',
}: {
  moduleKey: ModuleKey;
  view?: string;
}) {
  const m = MODULES[moduleKey];
  const current = m.views.find((v) => v.slug === view) ?? m.views[0]!;
  const Icon = m.icon;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{m.name}</h1>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              {current.heading}
            </span>
          </div>
          <p className="text-muted-foreground">{current.blurb}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {m.kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capabilities */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">What this agent does</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {m.capabilities.map((c) => {
            const CIcon = c.icon;
            return (
              <Card key={c.title} className="h-full">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <CIcon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {c.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Rollout note */}
      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">This agent is rolling out</p>
            <p className="text-sm text-muted-foreground">
              The {m.tagline.toLowerCase()} workspace is enabled for your org. Live
              data and actions are being connected — the metrics above are a
              representative preview.
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Configure <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
