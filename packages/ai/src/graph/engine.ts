import { END, type AgentDefinition, type AgentStep, type NodeContext } from './types';

export interface RunOptions {
  organizationId: string;
  maxSteps?: number;
  emit?: (token: string) => void;
  signal?: AbortSignal;
}

export interface RunOutcome<S> {
  state: S;
  steps: AgentStep[];
  tokensInput: number;
  tokensOutput: number;
}

/**
 * Executes an agent graph from its entry node until END or maxSteps.
 * Records every node execution as an AgentStep for tracing/replay.
 */
export async function runAgent<S>(
  agent: AgentDefinition<S>,
  initialState: S,
  opts: RunOptions,
): Promise<RunOutcome<S>> {
  const maxSteps = opts.maxSteps ?? 25;
  const steps: AgentStep[] = [];
  let tokensInput = 0;
  let tokensOutput = 0;

  let state = initialState;
  let current: string = agent.entry;
  let count = 0;

  const ctx: NodeContext = {
    organizationId: opts.organizationId,
    emit: opts.emit,
    signal: opts.signal,
    trace: (step) => {
      steps.push(step);
      tokensInput += step.tokensInput ?? 0;
      tokensOutput += step.tokensOutput ?? 0;
    },
  };

  while (current !== END) {
    if (opts.signal?.aborted) {
      throw new Error('Agent run aborted');
    }
    if (count++ >= maxSteps) {
      throw new Error(
        `Agent "${agent.key}" exceeded maxSteps (${maxSteps}) — possible cycle.`,
      );
    }
    const node = agent.nodes[current];
    if (!node) {
      throw new Error(`Agent "${agent.key}" has no node "${current}".`);
    }

    const result = await node(state, ctx);
    if (result.patch) {
      state = { ...state, ...result.patch };
    }
    current = result.next;
  }

  return { state, steps, tokensInput, tokensOutput };
}
