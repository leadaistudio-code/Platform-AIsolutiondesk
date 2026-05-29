'use client';

import { useRef, useState } from 'react';
import { Send, Loader2, Sparkles, FileText, User } from 'lucide-react';
import type { Citation } from '@aisolutiondesk/types';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

const SUGGESTIONS = [
  'How many days can I work remotely?',
  'What is the home office stipend?',
  'How do I request full-time remote work?',
];

/**
 * The Employee Assistant chat workspace. Sends questions to the RAG endpoint
 * and renders answers with their source citations.
 */
export function Chat() {
  const api = useApi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await api.askAssistant({ question: q });
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.answer, citations: res.citations },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `⚠️ ${(e as Error).message}` },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        endRef.current?.scrollIntoView({ behavior: 'smooth' }),
      );
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Ask your company knowledge</h2>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              I answer from documents you&apos;ve uploaded, with citations. Try one:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-white/5 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                m.role === 'user' ? 'bg-white/10' : 'bg-primary/15 text-primary',
              )}
            >
              {m.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
            <div className={cn('max-w-[80%]', m.role === 'user' && 'text-right')}>
              <div
                className={cn(
                  'inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'glass',
                )}
              >
                {m.content}
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.citations.map((c) => (
                    <span
                      key={c.documentId}
                      title={c.snippet}
                      className="inline-flex items-center gap-1 rounded-md border border-violet-500/20 bg-violet-500/5 px-2 py-0.5 text-xs text-violet-300"
                    >
                      <FileText className="h-3 w-3" /> {c.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="glass inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your documents…"
          className="h-11 flex-1 rounded-xl border border-border bg-white/5 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
        />
        <Button type="submit" size="icon" className="h-11 w-11" disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
