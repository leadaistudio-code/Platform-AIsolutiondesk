import { Injectable, Logger } from '@nestjs/common';
import { decryptJson } from '@aisolutiondesk/config';

export interface LinkedInCreds {
  accessToken: string;
  /** e.g. "urn:li:person:abc123" — the author of the post. */
  personUrn: string;
}

/**
 * Thin LinkedIn API client. Uses the v2 UGC Posts API to publish on the
 * authenticated user's personal feed, and the socialActions endpoint to read
 * engagement counts (likes + comments).
 *
 * Requires a LinkedIn access token with the `w_member_social` scope, obtained
 * from a LinkedIn Developer App.
 */
@Injectable()
export class LinkedInClient {
  private readonly logger = new Logger('LinkedIn');

  decryptCreds(blob: Buffer): LinkedInCreds {
    return decryptJson<LinkedInCreds>(blob);
  }

  /**
   * Publish a text-only post on the authenticated user's profile.
   * Uses LinkedIn's versioned REST Posts API (the legacy /v2/ugcPosts endpoint
   * rejects the modern `urn:li:person:<sub>` format from /v2/userinfo).
   */
  async createPost(creds: LinkedInCreds, text: string): Promise<{ urn: string }> {
    const body = {
      author: creds.personUrn,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
        // LinkedIn deprecates versions older than ~12 months — bump this
        // (YYYYMM) if a "NONEXISTENT_VERSION" error appears later.
        'LinkedIn-Version': '202504',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`LinkedIn post failed (${res.status}): ${detail}`);
    }

    // The post URN is returned in a header; fall back to the body just in case.
    const urn =
      res.headers.get('x-restli-id') ??
      ((await res.json().catch(() => ({}))) as { id?: string }).id;
    if (!urn) throw new Error('LinkedIn did not return a post URN');
    return { urn };
  }

  /** Fetch likes + comments counts for a previously-published post. */
  async getMetrics(
    creds: LinkedInCreds,
    postUrn: string,
  ): Promise<{ likes: number; comments: number }> {
    const encoded = encodeURIComponent(postUrn);
    const res = await fetch(
      `https://api.linkedin.com/v2/socialActions/${encoded}`,
      { headers: { Authorization: `Bearer ${creds.accessToken}` } },
    );
    if (!res.ok) {
      throw new Error(
        `LinkedIn metrics fetch failed (${res.status}): ${await res.text()}`,
      );
    }
    const j = (await res.json()) as {
      likesSummary?: { totalLikes?: number };
      commentsSummary?: { aggregatedTotalComments?: number; totalFirstLevelComments?: number };
    };
    return {
      likes: j.likesSummary?.totalLikes ?? 0,
      comments:
        j.commentsSummary?.aggregatedTotalComments ??
        j.commentsSummary?.totalFirstLevelComments ??
        0,
    };
  }
}
