import { Search, Bell } from 'lucide-react';
import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Button } from '@/components/ui/button';
import { clerkEnabled } from '@/components/providers/app-providers';

/**
 * The top bar: a (placeholder) search box, notifications, and the user menu.
 * The Clerk <UserButton> only renders when auth is configured; in preview mode
 * we show a simple avatar circle instead.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search tickets, leads, documents…"
          className="h-10 w-full rounded-lg border border-border bg-white/5 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </Button>

      {clerkEnabled ? (
        <>
          <OrganizationSwitcher
            hidePersonal
            appearance={{ baseTheme: dark }}
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
          />
          <UserButton afterSignOutUrl="/" />
        </>
      ) : (
        <div
          title="Preview mode (Clerk not configured)"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary"
        >
          DO
        </div>
      )}
    </header>
  );
}
