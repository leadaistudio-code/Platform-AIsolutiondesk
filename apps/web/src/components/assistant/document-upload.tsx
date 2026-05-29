'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, FilePlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

const inputClass =
  'w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30';

/**
 * Upload a document for the assistant to learn from. You can paste text or pick
 * a .txt / .md file (read in the browser, so no file server is needed). The
 * backend then chunks + embeds it into the vector database.
 */
export function DocumentUpload() {
  const router = useRouter();
  const api = useApi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContent(text);
    if (!title) setTitle(file.name.replace(/\.(txt|md|markdown)$/i, ''));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createDocument({ title, content });
      setTitle('');
      setContent('');
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FilePlus className="h-4 w-4 text-primary" /> Add a document
          </div>

          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Remote Work Policy)"
            className={inputClass}
          />

          <textarea
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste document text here…"
            className={inputClass}
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.markdown,text/plain"
              onChange={onFile}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Upload .txt / .md
            </Button>
            <Button type="submit" size="sm" disabled={saving || !title || !content}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Indexing…' : 'Add & index'}
            </Button>
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
