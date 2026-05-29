import type { ProductKey } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';

/**
 * The shell shared by every signed-in page: sidebar + top bar + content.
 * Fetches /me on each render so the sidebar can hide products the org isn't
 * entitled to (and reveal an Admin section to platform admins).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let enabledProducts: ProductKey[] = [];
  let isPlatformAdmin = false;
  try {
    const api = await getServerApi();
    const me = await api.getMe();
    enabledProducts = me.organization.products;
    isPlatformAdmin = me.isPlatformAdmin;
  } catch {
    // /me may fail (e.g. fresh session pre-provisioning) — render an empty
    // sidebar; the page itself will handle the error.
  }

  return (
    <div className="relative flex min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-aurora opacity-60" />
      <Sidebar
        enabledProducts={enabledProducts}
        isPlatformAdmin={isPlatformAdmin}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
