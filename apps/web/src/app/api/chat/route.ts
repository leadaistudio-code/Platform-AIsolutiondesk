import OpenAI from 'openai';
import { CHATBOT_SYSTEM_PROMPT } from '@/lib/chatbot-knowledge';

/**
 * Public chatbot endpoint for the marketing site. Takes the running message
 * history and streams back the assistant's reply as plain text chunks. It runs
 * server-side so the OpenAI key never reaches the browser, and it is grounded
 * on the curated site knowledge base (see chatbot-knowledge.ts).
 */
export const runtime = 'nodejs';

const MODEL = process.env.CHATBOT_MODEL ?? 'gpt-4o-mini';

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'Chat is not configured (missing OPENAI_API_KEY).' },
      { status: 503 },
    );
  }

  let messages: IncomingMessage[];
  try {
    const body = (await req.json()) as { messages?: IncomingMessage[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Keep only valid turns and cap history so the prompt stays small/cheap.
  const history = messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (history.length === 0) {
    return Response.json({ error: 'No message provided.' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: MODEL,
    stream: true,
    temperature: 0.3,
    max_tokens: 600,
    messages: [
      { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
      ...history,
    ],
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch {
        controller.enqueue(
          encoder.encode('\n\n[Sorry — something went wrong. Please try again.]'),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
