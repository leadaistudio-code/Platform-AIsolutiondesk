import { cn } from '@/lib/utils';

/**
 * A small colored pill for statuses and priorities. The `tone` prop picks the
 * color; helper maps below translate ticket values to a tone.
 */
type Tone = 'gray' | 'blue' | 'amber' | 'red' | 'green' | 'violet';

const toneClasses: Record<Tone, string> = {
  gray: 'bg-white/10 text-muted-foreground',
  blue: 'bg-sky-500/15 text-sky-300',
  amber: 'bg-amber-500/15 text-amber-300',
  red: 'bg-rose-500/15 text-rose-300',
  green: 'bg-emerald-500/15 text-emerald-300',
  violet: 'bg-violet-500/15 text-violet-300',
};

export function Badge({
  children,
  tone = 'gray',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function priorityTone(priority: string): Tone {
  return (
    { LOW: 'gray', MEDIUM: 'blue', HIGH: 'amber', CRITICAL: 'red' } as const
  )[priority as 'LOW'] ?? 'gray';
}

export function statusTone(status: string): Tone {
  return (
    {
      NEW: 'blue',
      TRIAGED: 'violet',
      IN_PROGRESS: 'amber',
      WAITING: 'gray',
      RESOLVED: 'green',
      CLOSED: 'gray',
    } as const
  )[status as 'NEW'] ?? 'gray';
}
