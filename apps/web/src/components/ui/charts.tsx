import { cn } from '@/lib/utils';

/**
 * Small dependency-free charts that match the dark glass theme. Pure
 * presentational components (safe in server components).
 */

const PALETTE = [
  'hsl(252 95% 68%)',
  'hsl(190 90% 55%)',
  'hsl(330 85% 65%)',
  'hsl(150 70% 55%)',
  'hsl(40 95% 60%)',
  'hsl(220 15% 55%)',
];

export interface ChartDatum {
  label: string;
  value: number;
}

/** Horizontal bar list — good for "by category", "by priority". */
export function BarList({ data }: { data: ChartDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-foreground">{d.label}</span>
            <span className="text-muted-foreground">{d.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: PALETTE[i % PALETTE.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Donut chart — good for status distribution. */
export function Donut({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(0 0% 100% / 0.08)" strokeWidth="16" />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * circumference;
            const seg = (
              <circle
                key={d.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth="16"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className={cn('h-2.5 w-2.5 rounded-full')}
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="text-foreground">{d.label}</span>
            <span className="text-muted-foreground">{d.value}</span>
          </div>
        ))}
        {total === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
      </div>
    </div>
  );
}
