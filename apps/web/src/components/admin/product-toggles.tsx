'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Check } from 'lucide-react';
import {
  PRODUCT_KEYS,
  PRODUCT_LABELS,
  type AdminOrgDTO,
  type ProductKey,
} from '@aisolutiondesk/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/** Toggle each product on/off for a customer org and save the change. */
export function ProductToggles({ org }: { org: AdminOrgDTO }) {
  const router = useRouter();
  const api = useApi();
  const [selected, setSelected] = useState<ProductKey[]>(org.products);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(p: ProductKey) {
    setSelected((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    );
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.updateAdminOrgProducts(org.id, { products: selected });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="text-sm font-medium">
          Enable products for <span className="text-primary">{org.name}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRODUCT_KEYS.map((p) => {
            const on = selected.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-3 text-left text-sm transition-colors',
                  on
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground',
                )}
              >
                <span className="font-medium">{PRODUCT_LABELS[p]}</span>
                {on && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </Button>
          {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          Members of this org will only see the sections you enable. Disabling a
          product hides it from their sidebar (existing data is preserved).
        </p>
      </CardContent>
    </Card>
  );
}
