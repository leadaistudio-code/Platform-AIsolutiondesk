import Link from 'next/link';
import { Send, Mail, Linkedin, MessageCircle, Phone } from 'lucide-react';
import type { OutreachListItemDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const channelIcon: Record<string, typeof Mail> = {
  EMAIL: Mail,
  LINKEDIN: Linkedin,
  WHATSAPP: MessageCircle,
  SMS: Phone,
};

const statusTones: Record<string, 'gray' | 'blue' | 'green' | 'amber' | 'red'> = {
  DRAFT: 'gray',
  SCHEDULED: 'blue',
  SENT: 'blue',
  DELIVERED: 'blue',
  OPENED: 'amber',
  REPLIED: 'green',
  BOUNCED: 'red',
  FAILED: 'red',
};

/** AI Outreach hub — every AI-generated message across all leads. */
export default async function OutreachPage() {
  let items: OutreachListItemDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    items = await api.listOutreach();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Outreach</h1>
        <p className="text-muted-foreground">
          Every AI-generated message, across all your leads. Generate new ones from a
          lead&apos;s page.
        </p>
      </div>

      {error && (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load outreach: {error}</Card>
      )}

      <div className="space-y-3">
        {items.map((o) => {
          const Icon = channelIcon[o.channel] ?? Send;
          return (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  <Link href={`/sales/${o.leadId}`} className="font-medium hover:text-primary">
                    {o.leadName}
                  </Link>
                  {o.company && <span className="text-muted-foreground">· {o.company}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTones[o.status] ?? 'gray'}>{o.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {o.subject && <p className="mt-2 text-sm font-medium">{o.subject}</p>}
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {o.body}
              </p>
            </Card>
          );
        })}

        {items.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            No outreach yet. Open a lead and click <span className="text-foreground">Generate</span> to create one.
          </Card>
        )}
      </div>
    </div>
  );
}
