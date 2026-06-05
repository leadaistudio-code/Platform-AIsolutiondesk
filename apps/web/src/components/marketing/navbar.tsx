'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Plans', href: '/plans' },
];

/**
 * Sticky marketing top-bar. Turns from transparent to frosted glass once the
 * visitor scrolls past the hero, and collapses to a sheet menu on mobile.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The home hero is a dark image; until the bar gains its frosted background on
  // scroll, the links sit over it and must stay light regardless of theme.
  const overHero = pathname === '/' && !scrolled;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-border bg-background/70 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 font-semibold',
            overHero && 'text-white',
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <span className="tracking-tight">AISOLUTIONDESK</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm transition-colors',
                overHero
                  ? pathname === l.href
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                  : pathname === l.href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle light={overHero} />
          <Link href="/sign-in">
            <Button
              variant="ghost"
              size="sm"
              className={cn(overHero && 'text-white hover:bg-white/10')}
            >
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Start free</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle light={overHero} />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className={cn(overHero && 'text-white')}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 px-6 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'text-sm hover:text-foreground',
                  pathname === l.href ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/sign-up" onClick={() => setOpen(false)}>
              <Button className="w-full">Start free</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
