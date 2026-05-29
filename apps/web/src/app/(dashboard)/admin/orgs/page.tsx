import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';
import { PRODUCT_LABELS, type AdminOrgDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/** Platform admin → list every customer organization. */
export default async function AdminOrgsPage() {
  let orgs: AdminOrgDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    // Quick gate: if we aren't an admin, the API throws and we redirect.
    const me = await api.getMe();
    if (!me.isPlatformAdmin) redirect('/dashboard');
    orgs = await api.listAdminOrgs();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customer Organizations</h1>
        <p className="text-muted-foreground">
          Every org on the platform. Click one to toggle which AI products they have
          access to.
        </p>
      </div>

      {error && (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load orgs: {error}</Card>
      )}

      <div className="space-y-2">
        {orgs.map((o) => (
          <Link key={o.id} href={`/admin/orgs/${o.id}`}>
            <Card hover className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{o.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.slug} · {o.memberCount} member{o.memberCount === 1 ? '' : 's'} ·
                    joined {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {o.products.length === 0 ? (
                  <Badge tone="gray">No products</Badge>
                ) : (
                  o.products.map((p) => (
                    <Badge key={p} tone="violet">
                      {PRODUCT_LABELS[p]}
                    </Badge>
                  ))
                )}
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </Card>
          </Link>
        ))}
        {orgs.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            No customer organizations yet.
          </Card>
        )}
      </div>
    </div>
  );
}
