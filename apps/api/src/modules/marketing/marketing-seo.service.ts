import { BadGatewayException, Injectable } from '@nestjs/common';
import { Models } from '@aisolutiondesk/ai';
import type {
  KeywordClusterDTO,
  KeywordResearchDTO,
  KeywordResearchInput,
  SeoAnalysisDTO,
  SeoAnalyzeInput,
} from '@aisolutiondesk/types';
import type { RequestContext } from '../../common/context/request-context';
import { ModelService } from '../../ai/model.service';
import {
  asString,
  asStringArray,
  buildBrandBlock,
  parseJsonObject,
} from './marketing.shared';

@Injectable()
export class MarketingSeoService {
  constructor(private readonly models: ModelService) {}

  private async completeJson(
    system: string,
    user: string,
    maxTokens: number,
  ): Promise<Record<string, unknown>> {
    try {
      const res = await this.models.complete({
        model: Models.smart(),
        temperature: 0.4,
        maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      return parseJsonObject(res.content);
    } catch (err) {
      throw new BadGatewayException(
        `AI request failed: ${(err as Error).message}. Check your AI API key/model.`,
      );
    }
  }

  /** AI keyword research: clustered keyword ideas with intent + difficulty. */
  async keywords(
    ctx: RequestContext,
    input: KeywordResearchInput,
  ): Promise<KeywordResearchDTO> {
    const brand = await buildBrandBlock(ctx.organizationId);
    const user = [
      `Do SEO keyword research for the topic: "${input.topic}".`,
      input.audience ? `Audience: ${input.audience}` : '',
      brand,
      '',
      'Group keywords into 3-5 thematic clusters. For each keyword give: keyword,',
      'intent (informational | commercial | transactional | navigational),',
      'difficulty (Low | Medium | High), and volume (a relative label like "High", "Medium", "Low").',
      'Return STRICT JSON: {"clusters": [{"cluster": string, "keywords": [{"keyword": string, "intent": string, "difficulty": string, "volume": string}]}]}',
    ].join('\n');

    const obj = await this.completeJson(
      'You are an SEO keyword strategist. You output only valid JSON when asked.',
      user,
      1600,
    );
    const clusters = Array.isArray(obj.clusters) ? obj.clusters : [];
    const mapped: KeywordClusterDTO[] = clusters
      .map((c) => {
        const o = c as Record<string, unknown>;
        const kws = Array.isArray(o.keywords) ? o.keywords : [];
        return {
          cluster: asString(o.cluster, 'Keywords'),
          keywords: kws
            .map((k) => {
              const ko = k as Record<string, unknown>;
              return {
                keyword: asString(ko.keyword),
                intent: asString(ko.intent, 'informational'),
                difficulty: asString(ko.difficulty, 'Medium'),
                volume: asString(ko.volume, 'Medium'),
              };
            })
            .filter((k) => k.keyword)
            .slice(0, 12),
        };
      })
      .filter((c) => c.keywords.length > 0)
      .slice(0, 6);

    return { clusters: mapped };
  }

  /** AI SEO analysis: score + meta + actionable suggestions for a piece of text. */
  async analyze(
    ctx: RequestContext,
    input: SeoAnalyzeInput,
  ): Promise<SeoAnalysisDTO> {
    const user = [
      'Analyze the following content for SEO and return a structured review.',
      input.targetKeyword ? `Target keyword: ${input.targetKeyword}` : '',
      '',
      'CONTENT:',
      input.text,
      '',
      'Return STRICT JSON with this shape:',
      '{"score": number (0-100), "metaDescription": string (<=160 chars), "titleSuggestions": string[] (2-4), "issues": string[] (2-5 concrete problems), "improvements": string[] (3-6 actionable fixes), "keywordsFound": string[] (key terms detected)}',
    ].join('\n');

    const obj = await this.completeJson(
      'You are a meticulous SEO auditor. You output only valid JSON when asked.',
      user,
      1200,
    );

    const rawScore = typeof obj.score === 'number' ? obj.score : Number(obj.score);
    const score = Number.isFinite(rawScore)
      ? Math.max(0, Math.min(100, Math.round(rawScore)))
      : 0;

    return {
      score,
      metaDescription: asString(obj.metaDescription).slice(0, 320),
      titleSuggestions: asStringArray(obj.titleSuggestions, 4),
      issues: asStringArray(obj.issues, 6),
      improvements: asStringArray(obj.improvements, 8),
      keywordsFound: asStringArray(obj.keywordsFound, 15),
    };
  }
}
