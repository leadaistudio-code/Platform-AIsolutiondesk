'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A sun/moon button that flips between light and dark themes. Because the theme
 * is only known on the client, we render a neutral placeholder until mounted to
 * avoid a hydration mismatch.
 *
 * `light` forces light-colored icons — used when the toggle sits over the dark
 * hero image (before the navbar gains its frosted background on scroll).
 */
export function ThemeToggle({ light = false }: { light?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
        light
          ? 'border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
          : 'border-border text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
      )}
    >
      {/* Render both for a clean crossfade once mounted; hidden before that. */}
      {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
    </button>
  );
}
