import type { CrmConnectionDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { CrmManager } from '@/components/sales/crm-manager';

/** CRM Sync — connect Salesforce / HubSpot to sync leads. */
export default async function CrmPage() {
  let connections: CrmConnectionDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    connections = await api.listCrm();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM Sync</h1>
        <p className="text-muted-foreground">
          Connect your CRM so leads can sync. Keys are encrypted at rest.
        </p>
      </div>

      {error ? (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load CRM status: {error}</Card>
      ) : (
        <CrmManager connections={connections} />
      )}

      <p className="text-xs text-muted-foreground">
        Note: connecting stores your credentials securely. Two-way lead sync runs in the
        background and is being rolled out.
      </p>
    </div>
  );
}
