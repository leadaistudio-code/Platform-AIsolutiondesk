import Link from 'next/link';
import { PenSquare } from 'lucide-react';
import type { SocialPostDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SocialPostCard } from '@/components/social/post-card';

/** Social Media feed — every AI-generated post, newest first. */
export default async function SocialFeedPage() {
  let posts: SocialPostDTO[] = [];
  let error: string | null = null;
  try {
    const api = await getServerApi();
    posts = await api.listSocialPosts();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Social Media Feed</h1>
          <p className="text-muted-foreground">
            All AI-generated LinkedIn + X posts, with approvals and posting history.
          </p>
        </div>
        <Link href="/social/new">
          <Button>
            <PenSquare className="h-4 w-4" /> Generate post
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load posts: {error}</Card>
      )}

      <div className="space-y-3">
        {posts.map((p) => (
          <SocialPostCard key={p.id} post={p} />
        ))}
        {posts.length === 0 && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            No posts yet. Click <span className="text-foreground">Generate post</span> to
            create one.
          </Card>
        )}
      </div>
    </div>
  );
}
