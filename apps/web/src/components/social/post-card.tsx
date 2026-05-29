'use client';

import { useEffect, useRef, useState } from 'react';
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
  Pencil,
  CalendarClock,
  ImageIcon,
  X as XIcon,
  Save,
} from 'lucide-react';
import type { SocialPlatform, SocialPostDTO } from '@aisolutiondesk/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/api-client';

const statusTone: Record<string, 'gray' | 'amber' | 'green' | 'red' | 'violet' | 'blue'> = {
  DRAFT: 'gray',
  PENDING_APPROVAL: 'amber',
  APPROVED: 'green',
  SCHEDULED: 'blue',
  REJECTED: 'red',
  POSTED: 'violet',
};

const inputClass =
  'w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/30';

/** Returns a `YYYY-MM-DDTHH:MM` string in local time for an <input type=datetime-local>. */
function defaultScheduleValue(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // +1h
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Small subcomponent: fetches the image bytes (auth'd) and shows it. */
function PostImage({ postId }: { postId: string }) {
  const api = useApi();
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let url: string | null = null;
    api
      .socialImageBlobUrl(postId)
      .then((u) => {
        if (active) {
          url = u;
          setSrc(u);
        } else {
          URL.revokeObjectURL(u);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, postId]);

  if (!src) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-white/5 text-xs text-muted-foreground">
        Loading image…
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt="Attached"
      className="max-h-80 w-full rounded-xl border border-border object-cover"
    />
  );
}

export function SocialPostCard({ post }: { post: SocialPostDTO }) {
  const router = useRouter();
  const api = useApi();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [editing, setEditing] = useState(false);
  const [draftLi, setDraftLi] = useState(post.linkedinText);
  const [draftX, setDraftX] = useState(post.xText);

  const [scheduling, setScheduling] = useState(false);
  const [schedAt, setSchedAt] = useState(defaultScheduleValue());
  const [schedPlatforms, setSchedPlatforms] = useState<SocialPlatform[]>([
    'LINKEDIN',
  ]);

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
  async function markPosted(platform: SocialPlatform) {
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
  async function saveEdit() {
    setBusy('save');
    setError(null);
    try {
      await api.updateSocialPost(post.id, { linkedinText: draftLi, xText: draftX });
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function doSchedule() {
    setBusy('schedule');
    setError(null);
    try {
      await api.scheduleSocialPost(post.id, {
        scheduledAt: new Date(schedAt).toISOString(),
        platforms: schedPlatforms,
      });
      setScheduling(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function cancelSchedule() {
    setBusy('cancel-schedule');
    try {
      await api.cancelScheduleSocialPost(post.id);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy('image');
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] ?? '');
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      await api.attachSocialImage(post.id, { mimeType: file.type, base64 });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  async function removeImage() {
    setBusy('remove-image');
    try {
      await api.removeSocialImage(post.id);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const canReview = post.status === 'PENDING_APPROVAL';
  const canEdit = post.status !== 'POSTED';
  const canSchedule = post.status === 'APPROVED' || post.status === 'SCHEDULED';
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
          {post.scheduledFor && (
            <span className="ml-2 inline-flex items-center gap-1 text-blue-300">
              <CalendarClock className="h-3 w-3" /> Scheduled{' '}
              {new Date(post.scheduledFor).toLocaleString()} ·{' '}
              {post.scheduledPlatforms.join(' + ')}
            </span>
          )}
          {post.rejectedReason && (
            <span className="ml-2 text-rose-400">· {post.rejectedReason}</span>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image preview */}
        {post.hasImage && <PostImage postId={post.id} />}

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
            {!editing && (
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
            )}
          </div>
          {editing ? (
            <textarea
              rows={6}
              value={draftLi}
              onChange={(e) => setDraftLi(e.target.value)}
              className={inputClass}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm">{post.linkedinText}</p>
          )}
        </div>

        {/* X */}
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Twitter className="h-3.5 w-3.5" /> X ·{' '}
              {(editing ? draftX : post.xText).length}/280
              {post.xPostedAt && (
                <span className="text-muted-foreground">
                  · posted {new Date(post.xPostedAt).toLocaleDateString()}
                </span>
              )}
            </span>
            {!editing && (
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
            )}
          </div>
          {editing ? (
            <textarea
              rows={3}
              value={draftX}
              maxLength={280}
              onChange={(e) => setDraftX(e.target.value)}
              className={inputClass}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm">{post.xText}</p>
          )}
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        {/* Edit toolbar */}
        {editing ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button size="sm" onClick={saveEdit} disabled={busy !== null}>
              {busy === 'save' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setDraftLi(post.linkedinText);
                setDraftX(post.xText);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {canEdit && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
            {canEdit && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={onPickImage}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy !== null}
                >
                  {busy === 'image' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                  {post.hasImage ? 'Replace image' : 'Add image'}
                </Button>
                {post.hasImage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={removeImage}
                    disabled={busy !== null}
                  >
                    <XIcon className="h-4 w-4" /> Remove image
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Approve / reject */}
        {canReview && !editing && (
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

        {/* Schedule */}
        {canSchedule && !editing && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {!scheduling ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setScheduling(true)}
                  disabled={busy !== null}
                >
                  <CalendarClock className="h-4 w-4" />
                  {post.status === 'SCHEDULED' ? 'Reschedule' : 'Schedule'}
                </Button>
                {post.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelSchedule}
                    disabled={busy !== null}
                  >
                    Cancel schedule
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  value={schedAt}
                  onChange={(e) => setSchedAt(e.target.value)}
                  className="rounded-lg border border-border bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-primary/50"
                />
                {(['LINKEDIN', 'X'] as SocialPlatform[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setSchedPlatforms((cur) =>
                        cur.includes(p) ? cur.filter((c) => c !== p) : [...cur, p],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      schedPlatforms.includes(p)
                        ? 'border-primary/50 bg-primary/15 text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <Button
                  size="sm"
                  onClick={doSchedule}
                  disabled={busy !== null || schedPlatforms.length === 0}
                >
                  {busy === 'schedule' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setScheduling(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Publish */}
        {canPost && !editing && (
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

        {/* Metrics */}
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
