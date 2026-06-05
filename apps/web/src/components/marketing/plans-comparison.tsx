import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The Plans page table — a detailed, feature-by-feature comparison across every
 * tier. The actual checkout lives on /pricing, so each paid plan's CTA links
 * there; Enterprise routes to sign-up / contact-sales.
 *
 * A cell value of `true` renders a check, `false` renders a dash, and a string
 * renders verbatim.
 */

type Cell = boolean | string;

interface PlanColumn {
  name: string;
  price: string;
  cadence: string;
  cta: string;
  href: string;
  highlighted: boolean;
}

const PLANS: PlanColumn[] = [
  { name: 'Starter', price: '$49', cadence: '/mo', cta: 'Start free trial', href: '/pricing', highlighted: false },
  { name: 'Growth', price: '$199', cadence: '/mo', cta: 'Start free trial', href: '/pricing', highlighted: true },
  { name: 'Enterprise', price: 'Custom', cadence: '', cta: 'Talk to sales', href: '/sign-up', highlighted: false },
];

interface FeatureRow {
  label: string;
  /** One cell per plan, in the same order as PLANS. */
  cells: [Cell, Cell, Cell];
}

const ROWS: FeatureRow[] = [
  { label: 'AI products', cells: ['1 product', 'Up to 3', 'All 4'] },
  { label: 'Team seats', cells: ['Up to 3', 'Up to 15', 'Unlimited'] },
  { label: 'AI actions / mo', cells: ['5,000', '50,000', 'Unlimited'] },
  { label: 'Support', cells: ['Email', 'Priority', 'Dedicated manager'] },
  { label: 'Integrations', cells: ['Standard', 'CRM & Slack sync', 'All + custom'] },
  { label: 'Custom brand persona', cells: [false, true, true] },
  { label: '3-day free trial', cells: [true, true, 'Tailored'] },
  { label: 'SSO & SCIM', cells: [false, false, true] },
  { label: 'SLA & on-prem options', cells: [false, false, true] },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-primary" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

export function PlansComparison() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-primary">
          Plans
        </span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Compare every plan
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          See exactly what each tier includes. Looking for prices and billing
          options?{' '}
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            View pricing
          </Link>
          .
        </p>
      </div>

      <div className="mt-16 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="w-1/4 p-4 text-left align-bottom" />
              {PLANS.map((p) => (
                <th
                  key={p.name}
                  className={cn(
                    'w-1/4 rounded-t-2xl p-6 text-center align-bottom',
                    p.highlighted && 'border-2 border-b-0 border-primary/50 bg-gradient-to-b from-primary/10 to-transparent',
                  )}
                >
                  {p.highlighted && (
                    <div className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Most popular
                    </div>
                  )}
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{p.price}</span>
                    <span className="text-muted-foreground">{p.cadence}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-white/10">
                <td className="p-4 text-sm font-medium text-foreground">{row.label}</td>
                {row.cells.map((cell, i) => (
                  <td
                    key={PLANS[i].name}
                    className={cn(
                      'p-4 text-center',
                      PLANS[i].highlighted && 'border-x-2 border-primary/50 bg-primary/[0.04]',
                    )}
                  >
                    <CellValue value={cell} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-white/10">
              <td className="p-4" />
              {PLANS.map((p) => (
                <td
                  key={p.name}
                  className={cn(
                    'rounded-b-2xl p-6 text-center align-top',
                    p.highlighted && 'border-2 border-t-0 border-primary/50 bg-gradient-to-t from-primary/10 to-transparent',
                  )}
                >
                  <Link href={p.href}>
                    <Button className="w-full" variant={p.highlighted ? 'primary' : 'outline'}>
                      {p.cta}
                    </Button>
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
