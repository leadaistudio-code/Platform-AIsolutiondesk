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
   * LinkedIn's /rest/posts `commentary` field requires these characters to be
   * escaped with a leading backslash — otherwise the post silently truncates
   * at the first unescaped one (e.g. an opening parenthesis or hashtag).
   * Per https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
   */
  private escapeCommentary(text: string): string {
    return text.replace(/([\\<>#~_*[\]()@!])/g, '\\$1');
  }

  /**
   * Upload an image to LinkedIn's asset registry. Returns the image URN
   * which can then be referenced as media in a post body.
   */
  async uploadImage(
    creds: LinkedInCreds,
    bytes: Buffer,
    mimeType: string,
  ): Promise<{ urn: string }> {
    // 1. Initialize upload — LinkedIn returns an uploadUrl and the image URN.
    const initRes = await fetch(
      'https://api.linkedin.com/rest/images?action=initializeUpload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202604',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          initializeUploadRequest: { owner: creds.personUrn },
        }),
      },
    );
    if (!initRes.ok) {
      throw new Error(
        `LinkedIn image init failed (${initRes.status}): ${await initRes.text()}`,
      );
    }
    const init = (await initRes.json()) as {
      value?: { uploadUrl?: string; image?: string };
    };
    const uploadUrl = init.value?.uploadUrl;
    const urn = init.value?.image;
    if (!uploadUrl || !urn) throw new Error('LinkedIn image init: missing uploadUrl or image URN');

    // 2. PUT the raw bytes to the upload URL.
    const upRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': mimeType,
      },
      body: bytes,
    });
    if (!upRes.ok) {
      throw new Error(
        `LinkedIn image upload failed (${upRes.status}): ${await upRes.text()}`,
      );
    }
    return { urn };
  }

  /**
   * Publish a text post on the authenticated user's profile, optionally with
   * an attached image (URN obtained from uploadImage).
   * Uses LinkedIn's versioned REST Posts API (the legacy /v2/ugcPosts endpoint
   * rejects the modern `urn:li:person:<sub>` format from /v2/userinfo).
   */
  async createPost(
    creds: LinkedInCreds,
    text: string,
    imageUrn?: string,
  ): Promise<{ urn: string }> {
    const body: Record<string, unknown> = {
      author: creds.personUrn,
      commentary: this.escapeCommentary(text),
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };
    if (imageUrn) {
      body.content = { media: { id: imageUrn } };
    }

    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
        // LinkedIn deprecates versions older than ~12 months — bump this
        // (YYYYMM) if a "NONEXISTENT_VERSION" error appears later.
        'LinkedIn-Version': '202604',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      // LinkedIn often returns empty bodies on 403 — surface the diagnostic
      // headers (x-li-error-id, x-restli-error-response-type) so the cause
      // can actually be looked up in LinkedIn's support tools.
      const liError = res.headers.get('x-li-error-id') ?? 'none';
      const liErrType = res.headers.get('x-restli-error-response-type') ?? 'none';
      throw new Error(
        `LinkedIn post failed (${res.status}): ${detail || '(empty body)'} ` +
          `[errorId=${liError}, type=${liErrType}]`,
      );
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
