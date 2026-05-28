'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Linkedin,
  Twitter,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Heart,
  MessageCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import type { SocialPostDTO } from '@aisolutiondesk/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/api-client';

const statusTone: Record<string, 'gray' | 'amber' | 'green' | 'red' | 'violet'> = {
  DRAFT: 'gray',
  PENDING_APPROVAL: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  POSTED: 'violet',
};

/**
 * One social post in the feed: shows both LinkedIn & X drafts, copy buttons,
 * approval controls (if pending), and platform "Mark posted" buttons (if approved).
 */
export function SocialPostCard({ post }: { post: SocialPostDTO }) {
  const router = useRouter();
  const api = useApi();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  async function approve() {
    setBusy('approve');
    setError(null);
    try {
      await api.reviewSocialPost(post.id, { approve: true });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!rejectReason.trim()) return;
    setBusy('reject');
    setError(null);
    try {
      await api.reviewSocialPost(post.id, { approve: false, reason: rejectReason });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function markPosted(platform: 'LINKEDIN' | 'X') {
    setBusy(`post-${platform}`);
    setError(null);
    try {
      await api.markSocialPosted(post.id, { platform });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function refreshMetrics() {
    setBusy('metrics');
    setError(null);
    try {
      await api.refreshSocialMetrics(post.id);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const canReview = post.status === 'PENDING_APPROVAL';
  const canPost = post.status === 'APPROVED' || post.status === 'POSTED';
  const hasLinkedInPost = !!post.linkedinPostUrn;
  const liMetrics = post.metrics?.linkedin;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> {post.topic}
          </CardTitle>
          <div className="flex items-center gap-2">
            {post.autoPosted && (
              <Badge tone="violet">
                <Zap className="mr-1 h-3 w-3" /> Auto-posted
              </Badge>
            )}
            <Badge tone={statusTone[post.status] ?? 'gray'}>
              {post.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(post.createdAt).toLocaleString()}
          {post.rejectedReason && (
            <span className="ml-2 text-rose-400">· {post.rejectedReason}</span>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* LinkedIn */}
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300">
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              {post.linkedinPostedAt && (
                <span className="text-muted-foreground">
                  · posted {new Date(post.linkedinPostedAt).toLocaleDateString()}
                </span>
              )}
            </span>
            <button
              onClick={() => copy('li', post.linkedinText)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied === 'li' ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm">{post.linkedinText}</p>
        </div>

        {/* X */}
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Twitter className="h-3.5 w-3.5" /> X · {post.xText.length}/280
              {post.xPostedAt && (
                <span className="text-muted-foreground">
                  · posted {new Date(post.xPostedAt).toLocaleDateString()}
                </span>
              )}
            </span>
            <button
              onClick={() => copy('x', post.xText)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied === 'x' ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm">{post.xText}</p>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        {/* Actions */}
        {canReview && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button size="sm" disabled={busy !== null} onClick={approve}>
              {busy === 'approve' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </Button>
            {!showReject ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReject(true)}
                disabled={busy !== null}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            ) : (
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason"
                  className="min-w-[160px] flex-1 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-primary/50"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={reject}
                  disabled={busy !== null || !rejectReason.trim()}
                >
                  {busy === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm
                </Button>
              </div>
            )}
          </div>
        )}

        {canPost && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy !== null || !!post.linkedinPostedAt}
              onClick={() => markPosted('LINKEDIN')}
            >
              {busy === 'post-LINKEDIN' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {post.linkedinPostedAt ? 'Posted on LinkedIn' : 'Mark posted on LinkedIn'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy !== null || !!post.xPostedAt}
              onClick={() => markPosted('X')}
            >
              {busy === 'post-X' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {post.xPostedAt ? 'Posted on X' : 'Mark posted on X'}
            </Button>
          </div>
        )}

        {/* LinkedIn engagement metrics — only when a real LinkedIn post URN exists. */}
        {hasLinkedInPost && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Heart className="h-4 w-4 text-rose-400" />
                <span className="font-medium text-foreground">{liMetrics?.likes ?? 0}</span> likes
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-sky-400" />
                <span className="font-medium text-foreground">{liMetrics?.comments ?? 0}</span> comments
              </span>
              {post.metricsLastSyncedAt && (
                <span className="text-xs text-muted-foreground">
                  Synced {new Date(post.metricsLastSyncedAt).toLocaleString()}
                </span>
              )}
            </div>
            <Button size="sm" variant="ghost" disabled={busy !== null} onClick={refreshMetrics}>
              {busy === 'metrics' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh metrics
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
