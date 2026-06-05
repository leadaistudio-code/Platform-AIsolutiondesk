import { BadGatewayException, Injectable } from '@nestjs/common';
import { prisma } from '@aisolutiondesk/db';
import { Models } from '@aisolutiondesk/ai';
import type {
  FinanceForecastDTO,
  FinanceForecastPoint,
  FinanceMetricsDTO,
  FinanceReportDTO,
  FinanceSeriesPoint,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Pull the first JSON object out of an LLM response, tolerating code fences. */
function parseJsonObject(text: string): unknown {
  const fenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in response');
  return JSON.parse(fenced.slice(start, end + 1));
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 8) : [];
}

@Injectable()
export class FinanceAnalysisService {
  constructor(private readonly models: ModelService) {}

  /** Compute headline KPIs + the monthly time series. */
  async metrics(ctx: RequestContext): Promise<FinanceMetricsDTO> {
    const rows = await prisma.financialSnapshot.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { period: 'asc' },
    });

    const series: FinanceSeriesPoint[] = rows.map((r) => ({
      period: isoDate(r.period),
      label: monthLabel(r.period),
      revenue: r.revenue,
      expenses: r.expenses,
      cash: r.cash,
    }));

    if (series.length === 0) {
      return {
        mrr: 0,
        netBurn: 0,
        runwayMonths: null,
        cash: 0,
        revenueGrowthPct: 0,
        marginPct: 0,
        hasData: false,
        series,
      };
    }

    const latest = rows[rows.length - 1]!;
    const prev = rows.length > 1 ? rows[rows.length - 2] : undefined;

    // netBurn: revenue - expenses (negative = burning cash).
    const netBurn = latest.revenue - latest.expenses;
    const runwayMonths =
      netBurn < 0 && latest.cash > 0
        ? Math.floor(latest.cash / Math.abs(netBurn))
        : null;
    const revenueGrowthPct =
      prev && prev.revenue > 0
        ? ((latest.revenue - prev.revenue) / prev.revenue) * 100
        : 0;
    const marginPct =
      latest.revenue > 0
        ? ((latest.revenue - latest.expenses) / latest.revenue) * 100
        : 0;

    return {
      mrr: latest.revenue,
      netBurn,
      runwayMonths,
      cash: latest.cash,
      revenueGrowthPct: Math.round(revenueGrowthPct * 10) / 10,
      marginPct: Math.round(marginPct * 10) / 10,
      hasData: true,
      series,
    };
  }

  /** Build a compact snapshot of the financials and have the AI write a report. */
  async report(ctx: RequestContext): Promise<FinanceReportDTO> {
    const m = await this.metrics(ctx);
    if (!m.hasData) {
      return {
        summary: 'No financial data yet. Add monthly snapshots to generate a report.',
        highlights: [],
        risks: [],
        recommendations: [],
      };
    }

    const table = m.series
      .map(
        (p) =>
          `${p.label}: revenue $${p.revenue.toLocaleString()}, expenses $${p.expenses.toLocaleString()}, cash $${p.cash.toLocaleString()}`,
      )
      .join('\n');

    const prompt = [
      'You are a sharp FP&A analyst. Analyze the monthly financials below and',
      'return STRICT JSON (no prose, no code fences) with this exact shape:',
      '{"summary": string, "highlights": string[], "risks": string[], "recommendations": string[]}',
      'Keep summary to 2-3 sentences. Each array: 2-4 short, specific bullet strings grounded in the numbers.',
      '',
      `Key metrics: MRR $${m.mrr.toLocaleString()}, net monthly ${m.netBurn < 0 ? 'burn' : 'profit'} $${Math.abs(m.netBurn).toLocaleString()}, cash $${m.cash.toLocaleString()}, runway ${m.runwayMonths ?? 'n/a'} months, MoM revenue growth ${m.revenueGrowthPct}%, margin ${m.marginPct}%.`,
      '',
      'Monthly history:',
      table,
    ].join('\n');

    try {
      const res = await this.models.complete({
        model: Models.smart(),
        temperature: 0.3,
        maxTokens: 700,
        messages: [
          { role: 'system', content: 'You output only valid JSON when asked.' },
          { role: 'user', content: prompt },
        ],
      });
      const obj = parseJsonObject(res.content) as Record<string, unknown>;
      return {
        summary:
          typeof obj.summary === 'string' ? obj.summary : 'Report generated.',
        highlights: asStringArray(obj.highlights),
        risks: asStringArray(obj.risks),
        recommendations: asStringArray(obj.recommendations),
      };
    } catch (err) {
      throw new BadGatewayException(
        `AI report failed: ${(err as Error).message}. Check your AI API key/model.`,
      );
    }
  }

  /** Project the next 6 months from recent trend, then add an AI commentary. */
  async forecast(ctx: RequestContext): Promise<FinanceForecastDTO> {
    const m = await this.metrics(ctx);
    if (!m.hasData) {
      return { months: [], commentary: 'No financial data yet to forecast from.' };
    }

    const series = m.series;
    const last = series[series.length - 1]!;

    // Average MoM growth across available history (clamped to a sane range).
    const growth = (key: 'revenue' | 'expenses') => {
      const rates: number[] = [];
      for (let i = 1; i < series.length; i++) {
        const prev = series[i - 1]![key];
        if (prev > 0) rates.push((series[i]![key] - prev) / prev);
      }
      const avg = rates.length
        ? rates.reduce((a, b) => a + b, 0) / rates.length
        : 0;
      return Math.max(-0.2, Math.min(0.2, avg));
    };
    const gRev = growth('revenue');
    const gExp = growth('expenses');

    const months: FinanceForecastPoint[] = [];
    let rev = last.revenue;
    let exp = last.expenses;
    let cash = last.cash;
    const base = new Date(`${last.period}T00:00:00Z`);
    for (let i = 1; i <= 6; i++) {
      rev = Math.round(rev * (1 + gRev));
      exp = Math.round(exp * (1 + gExp));
      cash = cash + (rev - exp);
      const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + i, 1));
      months.push({
        period: isoDate(d),
        label: monthLabel(d),
        projectedRevenue: rev,
        projectedExpenses: exp,
        projectedCash: cash,
      });
    }

    let commentary = '';
    try {
      const summary = months
        .map((p) => `${p.label}: rev $${p.projectedRevenue.toLocaleString()}, cash $${p.projectedCash.toLocaleString()}`)
        .join('\n');
      const res = await this.models.complete({
        model: Models.smart(),
        temperature: 0.3,
        maxTokens: 220,
        messages: [
          {
            role: 'system',
            content: 'You are a concise FP&A analyst. Reply in 2-3 plain sentences, no markdown.',
          },
          {
            role: 'user',
            content: `Based on this 6-month projection (revenue MoM ${Math.round(gRev * 1000) / 10}%, expenses MoM ${Math.round(gExp * 1000) / 10}%), give a brief outlook and the single most important risk:\n${summary}`,
          },
        ],
      });
      commentary = res.content.trim();
    } catch {
      commentary =
        'Projection based on recent trend. Connect a live AI key for an AI-written outlook.';
    }

    return { months, commentary };
  }
}
