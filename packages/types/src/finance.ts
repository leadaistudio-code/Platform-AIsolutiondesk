/**
 * Contracts for the AI Finance Analysis agent: computed KPIs from the org's
 * monthly financial snapshots, an AI-generated narrative report, and a forecast.
 */

/** One month of figures, returned for charting. */
export interface FinanceSeriesPoint {
  /** ISO date of the first day of the month (e.g. 2026-05-01). */
  period: string;
  /** Human label, e.g. "May 2026". */
  label: string;
  revenue: number;
  expenses: number;
  cash: number;
}

/** Headline financial KPIs computed from the snapshots. */
export interface FinanceMetricsDTO {
  /** Most recent month's revenue (used as MRR proxy). */
  mrr: number;
  /** Latest month revenue minus expenses (negative = burning). */
  netBurn: number;
  /** Months of runway at the current burn (null if profitable/unknown). */
  runwayMonths: number | null;
  /** Latest cash balance. */
  cash: number;
  /** Month-over-month revenue growth, as a percentage. */
  revenueGrowthPct: number;
  /** Latest gross-margin-style ratio: (revenue - expenses) / revenue, %. */
  marginPct: number;
  /** Whether any snapshots exist yet. */
  hasData: boolean;
  /** Time series, oldest first. */
  series: FinanceSeriesPoint[];
}

/** AI-generated narrative report grounded on the snapshots. */
export interface FinanceReportDTO {
  summary: string;
  highlights: string[];
  risks: string[];
  recommendations: string[];
}

/** One projected future month. */
export interface FinanceForecastPoint {
  period: string;
  label: string;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedCash: number;
}

/** Forecast: computed projections + an AI commentary. */
export interface FinanceForecastDTO {
  months: FinanceForecastPoint[];
  commentary: string;
}
