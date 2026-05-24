/**
 * A minimal, typed agent-graph runtime (LangGraph-style) with no external
 * orchestration dependency. An agent is a directed graph of nodes that share
 * a typed mutable state object. Each node returns a partial state patch and
 * the name of the next node (or END).
 *
 * This keeps orchestration logic explicit, testable, and replayable — every
 * step is recorded into AgentRun.steps for tracing.
 */

export const END = '__end__' as const;
export type EndMarker = typeof END;

export interface NodeContext {
  organizationId: string;
  /** Emit a trace step (persisted to AgentRun.steps). */
  trace: (step: AgentStep) => void;
  /** Emit a streaming token to subscribed WS clients, if any. */
  emit?: (token: string) => void;
  signal?: AbortSignal;
}

export interface AgentStep {
  node: string;
  startedAt: number;
  finishedAt: number;
  tokensInput?: number;
  tokensOutput?: number;
  note?: string;
}

export type NodeResult<S> = {
  patch?: Partial<S>;
  next: string | EndMarker;
};

export type NodeFn<S> = (
  state: S,
  ctx: NodeContext,
) => Promise<NodeResult<S>>;

export interface AgentDefinition<S> {
  /** Stable identifier, e.g. "service_desk.triage". */
  key: string;
  /** Entry node name. */
  entry: string;
  nodes: Record<string, NodeFn<S>>;
}
