import { Twitter } from 'lucide-react';
import type { SocialConnectionDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LinkedInConnector } from '@/components/social/linkedin-connector';

/** Social Connections — connect LinkedIn / X for real auto-posting + metrics. */
export default async function SocialConnectionsPage() {
  let connections: SocialConnectionDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    connections = await api.listSocialConnections();
  } catch (e) {
    error = (e as Error).message;
  }

  const linkedin = connections.find((c) => c.provider === 'LINKEDIN');
  const x = connections.find((c) => c.provider === 'X');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Social Connections</h1>
        <p className="text-muted-foreground">
          Connect your accounts so the platform can publish posts and pull engagement
          metrics directly. Credentials are encrypted at rest.
        </p>
      </div>

      {error && (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load connections: {error}</Card>
      )}

      {linkedin && <LinkedInConnector conn={linkedin} />}

      {/* X (Twitter) — connection UI scaffolded but auto-post requires paid API */}
      {x && (
        <Card>
          <CardContent className="space-y-2 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Twitter className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">X (Twitter)</p>
                  <p className="text-xs text-muted-foreground">
                    Auto-posting via the X API requires a paid Basic tier — until that&apos;s
                    enabled, &quot;Mark posted on X&quot; remains a manual confirmation.
                  </p>
                </div>
              </div>
              <Badge tone="gray">Coming soon</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-2 pt-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How to get your LinkedIn token</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              Open the <span className="text-foreground">LinkedIn Developer Portal</span>{' '}
              and create an app (free).
            </li>
            <li>
              In the app, enable the <code className="text-foreground">Share on LinkedIn</code> /{' '}
              <code className="text-foreground">w_member_social</code> product.
            </li>
            <li>
              Use the <span className="text-foreground">OAuth Token Tools → Generate token</span>{' '}
              with the <code className="text-foreground">w_member_social</code> scope. Copy the
              access token.
            </li>
            <li>
              Get your Person URN: call{' '}
              <code className="text-foreground">GET https://api.linkedin.com/v2/userinfo</code>{' '}
              with that token; the <code className="text-foreground">sub</code> field gives you{' '}
              <code className="text-foreground">urn:li:person:&lt;sub&gt;</code>.
            </li>
            <li>Paste both into the form above and click Connect.</li>
          </ol>
          <p className="pt-1">
            Tokens generated from the dev portal usually last 60 days — reconnect when it
            expires.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
