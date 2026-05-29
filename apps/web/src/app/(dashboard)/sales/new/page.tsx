'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

const inputClass =
  'w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30';

/** Form to add a new lead. */
export default function NewLeadPage() {
  const router = useRouter();
  const api = useApi();
  const [form, setForm] = useState({
    fullName: '',
    title: '',
    company: '',
    email: '',
    linkedinUrl: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createLead(form);
      router.push('/sales');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/sales"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New lead</h1>
        <p className="text-muted-foreground">Add a prospect, then score them with AI.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Full name</label>
                <input required value={form.fullName} onChange={set('fullName')} className={inputClass} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input value={form.title} onChange={set('title')} className={inputClass} placeholder="VP Engineering" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Company</label>
                <input value={form.company} onChange={set('company')} className={inputClass} placeholder="Globex" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="jane@globex.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">LinkedIn URL</label>
                <input value={form.linkedinUrl} onChange={set('linkedinUrl')} className={inputClass} placeholder="https://linkedin.com/in/…" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+1 555 0100" />
              </div>
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !form.fullName}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Creating…' : 'Create lead'}
              </Button>
              <Link href="/sales">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
