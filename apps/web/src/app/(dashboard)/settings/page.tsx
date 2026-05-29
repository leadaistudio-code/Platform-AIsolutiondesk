import Link from 'next/link';
import { Plug, Palette, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

/** Hub page for settings — links to the existing per-feature settings pages. */
export default function SettingsPage() {
  const sections = [
    {
      label: 'Social Connections',
      description: 'Connect LinkedIn / X for auto-posting and metrics.',
      href: '/social/connections',
      icon: Plug,
    },
    {
      label: 'Brand Persona',
      description: 'Brand voice the AI uses for every generated social post.',
      href: '/social/persona',
      icon: Palette,
    },
    {
      label: 'CRM Sync',
      description: 'Connect Salesforce / HubSpot for lead sync.',
      href: '/sales/crm',
      icon: RefreshCw,
    },
    {
      label: 'Service Desk Settings',
      description: 'SLAs, routing, and workspace defaults.',
      href: '/service-desk/settings',
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Workspace, integrations, and feature-specific settings live here.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <Card hover className="h-full p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-medium">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
