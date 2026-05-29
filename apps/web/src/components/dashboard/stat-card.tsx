'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * An animated metric tile. It fades/slides up on mount (Framer Motion) and
 * shows a trend arrow. `index` staggers the animation so cards appear in
 * sequence for a polished feel.
 */
export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  icon: LucideIcon;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Card hover className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {delta && (
          <div
            className={cn(
              'mt-3 inline-flex items-center gap-1 text-xs font-medium',
              delta.positive ? 'text-emerald-400' : 'text-rose-400',
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {delta.value}
            <span className="text-muted-foreground">vs last week</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
