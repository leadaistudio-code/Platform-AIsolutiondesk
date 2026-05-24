import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { DocumentDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentUpload } from '@/components/assistant/document-upload';
import { DeleteDocumentButton } from '@/components/assistant/delete-document-button';

function statusBadge(status: string) {
  if (status === 'INDEXED')
    return (
      <Badge tone="green">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Indexed
      </Badge>
    );
  if (status === 'FAILED')
    return (
      <Badge tone="red">
        <AlertCircle className="mr-1 h-3 w-3" /> Failed
      </Badge>
    );
  return (
    <Badge tone="amber">
      <Loader2 className="mr-1 h-3 w-3 animate-spin" /> {status}
    </Badge>
  );
}

/**
 * Knowledge documents for the assistant. Server component: lists indexed
 * documents; the upload form and delete buttons are client components.
 */
export default async function DocumentsPage() {
  let docs: DocumentDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    docs = await api.listDocuments();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/assistant"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to chat
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Upload company knowledge. The assistant answers from these.
        </p>
      </div>

      <DocumentUpload />

      {error && (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load documents: {error}</Card>
      )}

      <div className="space-y-2">
        {docs.map((d) => (
          <Card key={d.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {d.chunkCount} chunk{d.chunkCount === 1 ? '' : 's'} ·{' '}
                  {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(d.status)}
              <DeleteDocumentButton id={d.id} />
            </div>
          </Card>
        ))}

        {docs.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            No documents yet. Add one above to get started.
          </Card>
        )}
      </div>
    </div>
  );
}
