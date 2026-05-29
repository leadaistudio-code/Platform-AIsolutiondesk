import Link from 'next/link';
import { Ticket, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';

/**
 * Service Desk overview. Server component that pulls live counts from the API.
 * Kept dependency-light (no client-only chart libs yet) so it renders instantly.
 */
export default async function ServiceDeskPage() {
  let total = 0;
  let triaged = 0;
  let highPriority = 0;
  let error: string | null = null;

  try {
    const api = await getServerApi();
    const all = await api.listTickets({ pageSize: '100' });
    total = all.total;
    triaged = all.items.filter((t) => t.status !== 'NEW').length;
    highPriority = all.items.filter(
      (t) => t.priority === 'HIGH' || t.priority === 'CRITICAL',
    ).length;
  } catch (e) {
    error = (e as Error).message;
  }

  const stats = [
    { label: 'Total tickets', value: total, icon: Ticket },
    { label: 'Triaged', value: triaged, icon: Sparkles },
    { label: 'High / critical', value: highPriority, icon: AlertTriangle },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Service Desk</h1>
        <p className="text-muted-foreground">Overview of your IT support operations.</p>
      </div>

      {error ? (
        <Card className="p-4 text-sm text-rose-300">API not reachable: {error}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} hover className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{s.value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Link href="/service-desk/tickets">
        <Card hover className="flex items-center justify-between p-5">
          <div>
            <p className="font-medium">View all tickets</p>
            <p className="text-sm text-muted-foreground">
              Browse, triage, and resolve support tickets.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
        </Card>
      </Link>
    </div>
  );
}
