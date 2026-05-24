import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Chat } from '@/components/assistant/chat';

/**
 * Chat Workspace — the home of the AI Employee Assistant. The interactive chat
 * itself is a client component; this page provides the header and frame.
 */
export default function AssistantPage() {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
          <p className="text-muted-foreground">
            Answers grounded in your company documents.
          </p>
        </div>
        <Link
          href="/assistant/documents"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          <FileText className="h-4 w-4" /> Manage documents
        </Link>
      </div>
      <Chat />
    </div>
  );
}
