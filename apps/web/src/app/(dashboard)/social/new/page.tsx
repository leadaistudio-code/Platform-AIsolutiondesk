import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GenerateForm } from '@/components/social/generate-form';

/** Generate-a-post page. */
export default function NewSocialPostPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/social"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate a social post</h1>
        <p className="text-muted-foreground">
          Provide a topic, or let the AI pick one for you.
        </p>
      </div>
      <GenerateForm redirectTo="/social/approvals" />
    </div>
  );
}
