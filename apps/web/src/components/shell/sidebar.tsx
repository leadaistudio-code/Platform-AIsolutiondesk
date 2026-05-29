'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { PRODUCTS, type NavItem, type ProductNav } from './nav-config';
import { clerkEnabled } from '@/components/providers/app-providers';

const COLLAPSE_STORAGE_KEY = 'aisol-nav-collapsed-v1';

/**
 * The left navigation rail. Adds three quality-of-life features:
 *  - search box that filters every product's items by label as you type;
 *  - per-product collapsible sections (state persisted in localStorage);
 *  - a pinned footer with Settings + Sign-out.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      // ignore — fresh state is fine
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [collapsed]);

  function toggle(key: string) {
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));
  }

  // Pre-compute filtered items per product so empty sections drop out while searching.
  const q = query.trim().toLowerCase();
  const sections = useMemo(() => {
    return PRODUCTS.map((p) => ({
      product: p,
      items: q
        ? p.items.filter((i) => i.label.toLowerCase().includes(q))
        : p.items,
    })).filter((s) => s.items.length > 0);
  }, [q]);

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col gap-4 overflow-hidden border-r border-border bg-card/40 p-4 lg:flex">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2 px-1 py-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">AISOLUTIONDESK</p>
          <p className="text-[11px] text-muted-foreground">AI Workforce Platform</p>
        </div>
      </Link>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the menu…"
          className="h-9 w-full rounded-lg border border-border bg-white/5 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {/* Scrollable middle area */}
      <nav className="flex-1 overflow-y-auto pr-1">
        {sections.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">
            No menu items match &quot;{q}&quot;.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {sections.map(({ product, items }) => (
              <ProductSection
                key={product.key}
                product={product}
                items={items}
                pathname={pathname}
                // While searching, force-expand so hits are visible.
                collapsed={q ? false : !!collapsed[product.key]}
                onToggle={() => toggle(product.key)}
                showToggle={!q}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Pinned footer: Settings + Sign out */}
      <div className="flex flex-col gap-0.5 border-t border-border pt-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-primary/15 text-foreground'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
          )}
        >
          <SettingsIcon className="h-4 w-4" /> Settings
        </Link>
        {clerkEnabled ? (
          <SignOutButton>
            <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-rose-300">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </SignOutButton>
        ) : (
          <span className="px-3 py-2 text-xs text-muted-foreground">Preview mode</span>
        )}
      </div>
    </aside>
  );
}

function ProductSection({
  product,
  items,
  pathname,
  collapsed,
  onToggle,
  showToggle,
}: {
  product: ProductNav;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  showToggle: boolean;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={showToggle ? onToggle : undefined}
        disabled={!showToggle}
        className={cn(
          'flex w-full items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
          showToggle && 'hover:text-foreground',
        )}
      >
        <span>{product.name}</span>
        {showToggle &&
          (collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          ))}
      </button>
      {!collapsed && (
        <div className="mt-2 flex flex-col gap-0.5">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href + '/'));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary/15 text-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
