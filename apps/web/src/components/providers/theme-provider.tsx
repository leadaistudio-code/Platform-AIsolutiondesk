'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * Thin wrapper around next-themes. It toggles the `dark` / `light` class on
 * <html>, which flips the CSS variables defined in globals.css. We default to
 * dark (the brand's premium look) but remember the visitor's choice.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
