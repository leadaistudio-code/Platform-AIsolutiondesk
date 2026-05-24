'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { useApi } from '@/lib/api-client';

/** Deletes a document (and its vectors) and refreshes the list. */
export function DeleteDocumentButton({ id }: { id: string }) {
  const router = useRouter();
  const api = useApi();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api.deleteDocument(id);
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      title="Delete document"
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-rose-400 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
