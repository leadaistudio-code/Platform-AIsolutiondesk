import { Sparkles } from 'lucide-react';

/**
 * A polished placeholder for pages that are planned but not built yet, so
 * sidebar links land somewhere intentional instead of a 404.
 */
export function ComingSoon({
  title,
  description = 'This section is on the roadmap. The platform foundation is in place — we’ll wire it up next.',
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Sparkles className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <span className="mt-4 inline-flex items-center rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-muted-foreground">
        Coming soon
      </span>
    </div>
  );
}
