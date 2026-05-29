import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { AdminOrgDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { ProductToggles } from '@/components/admin/product-toggles';

/** Org detail — toggle products on/off for one customer. */
export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let org: AdminOrgDTO | undefined;
  try {
    const api = await getServerApi();
    const me = await api.getMe();
    if (!me.isPlatformAdmin) redirect('/dashboard');
    org = await api.getAdminOrg(id);
  } catch {
    notFound();
  }
  if (!org) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/orgs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to all orgs
      </Link>

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{org.name}</h1>
            <p className="text-xs text-muted-foreground">
              {org.slug} · {org.memberCount} member{org.memberCount === 1 ? '' : 's'} ·
              joined {new Date(org.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      <ProductToggles org={org} />
    </div>
  );
}
