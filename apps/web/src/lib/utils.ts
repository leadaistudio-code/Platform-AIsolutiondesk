import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `cn` merges Tailwind class names intelligently — later classes win when they
 * conflict (e.g. cn('px-2', 'px-4') => 'px-4'). Used by every component so we
 * can pass extra classes in without breaking the base styles.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
