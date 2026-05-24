'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRODUCTS } from './nav-config';

/**
 * The left navigation rail. It lists each product and its pages, and highlights
 * the page you're currently on (matched against the URL). `'use client'` is
 * needed because it reads the current path with usePathname().
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-card/40 p-4 lg:flex">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">AISOLUTIONDESK</p>
          <p className="text-[11px] text-muted-foreground">AI Workforce Platform</p>
        </div>
      </Link>

      <nav className="flex flex-col gap-6">
        {PRODUCTS.map((product) => (
          <div key={product.key}>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {product.name}
            </p>
            <div className="mt-2 flex flex-col gap-0.5">
              {product.items.map((item) => {
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
                        active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
