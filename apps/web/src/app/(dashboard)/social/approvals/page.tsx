import type { SocialPostDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { SocialPostCard } from '@/components/social/post-card';

/** Approvals queue — only posts waiting for a yes/no. */
export default async function SocialApprovalsPage() {
  let pending: SocialPostDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    const all = await api.listSocialPosts();
    pending = all.filter((p) => p.status === 'PENDING_APPROVAL');
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          Review AI-generated posts before they go out. {pending.length} pending.
        </p>
      </div>

      {error && (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load: {error}</Card>
      )}

      <div className="space-y-3">
        {pending.map((p) => (
          <SocialPostCard key={p.id} post={p} />
        ))}
        {pending.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            🎉 Inbox zero — no posts waiting for approval.
          </Card>
        )}
      </div>
    </div>
  );
}
