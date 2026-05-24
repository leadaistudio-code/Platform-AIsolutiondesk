'use client';

import Link from 'next/link';
import {
  Ticket,
  Clock,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRODUCTS } from '@/components/shell/nav-config';

/**
 * The unified home dashboard. For now it shows representative sample numbers so
 * you can see the design; once the API is connected these come from real data.
 */
export default function DashboardPage() {
  const stats = [
    { label: 'Open Tickets', value: '128', delta: { value: '12%', positive: false }, icon: Ticket },
    { label: 'Avg. Resolution', value: '2.4h', delta: { value: '18%', positive: true }, icon: Clock },
    { label: 'Assistant Queries', value: '3,910', delta: { value: '7%', positive: true }, icon: MessageSquare },
    { label: 'Pipeline Value', value: '$1.2M', delta: { value: '24%', positive: true }, icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back 👋</h1>
        <p className="text-muted-foreground">
          Here&apos;s what your AI workforce has been up to.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* Products */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Your AI products</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Link key={p.key} href={p.items[0]!.href}>
              <Card hover className="h-full">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {p.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{p.tagline}</p>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm text-primary">
                    Open <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
