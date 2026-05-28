import type {
  AssistantAnswer,
  AssistantQueryInput,
  CampaignDTO,
  ConnectCrmInput,
  CreateCampaignInput,
  CreateDocumentInput,
  CreateLeadInput,
  CreateTicketInput,
  CrmConnectionDTO,
  CrmProvider,
  DocumentDTO,
  GenerateOutreachInput,
  GenerateProposalInput,
  LeadDTO,
  LeadDetailDTO,
  OutreachDTO,
  OutreachListItemDTO,
  ConnectLinkedInInput,
  GenerateSocialPostInput,
  MarkSocialPostedInput,
  ProposalDTO,
  ReviewSocialPostInput,
  SalesAnalyticsDTO,
  SalesInsightsDTO,
  SocialConnectionDTO,
  SocialPostDTO,
  SocialProvider,
  TicketDTO,
  TicketDetailDTO,
  TicketStatsDTO,
  UpdateCampaignInput,
  UpdateLeadInput,
  UpdateTicketInput,
} from '@aisolutiondesk/types';

/**
 * The backend base URL. Calls go directly to the NestJS API; the caller's
 * Clerk token (when signed in) is attached via the `getToken` function passed
 * to buildApi. In dev-bypass mode getToken returns null and the backend treats
 * the request as the demo org.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type TokenGetter = () => Promise<string | null>;

/**
 * Builds the typed API client bound to a token getter. Use `getServerApi()` in
 * server components and `useApi()` in client components rather than calling
 * this directly.
 */
export function buildApi(getToken: TokenGetter) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken().catch(() => null);
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`API ${res.status}: ${detail}`);
    }
    // 204 No Content has no body.
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  return {
    // ── Service Desk ──
    listTickets: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<Paginated<TicketDTO>>(`/tickets${qs ? `?${qs}` : ''}`);
    },
    getTicket: (id: string) => request<TicketDetailDTO>(`/tickets/${id}`),
    getStats: () => request<TicketStatsDTO>('/tickets/stats'),
    createTicket: (body: CreateTicketInput) =>
      request<TicketDTO>('/tickets', { method: 'POST', body: JSON.stringify(body) }),
    updateTicket: (id: string, body: UpdateTicketInput) =>
      request<TicketDTO>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    triageTicket: (id: string) =>
      request<TicketDTO>(`/tickets/${id}/triage`, { method: 'POST' }),

    // ── Employee Assistant ──
    listDocuments: () => request<DocumentDTO[]>('/documents'),
    createDocument: (body: CreateDocumentInput) =>
      request<DocumentDTO>('/documents', { method: 'POST', body: JSON.stringify(body) }),
    deleteDocument: (id: string) =>
      request<void>(`/documents/${id}`, { method: 'DELETE' }),
    askAssistant: (body: AssistantQueryInput) =>
      request<AssistantAnswer>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    // ── Sales Agent ──
    listLeads: () => request<LeadDTO[]>('/leads'),
    getLead: (id: string) => request<LeadDetailDTO>(`/leads/${id}`),
    createLead: (body: CreateLeadInput) =>
      request<LeadDTO>('/leads', { method: 'POST', body: JSON.stringify(body) }),
    updateLead: (id: string, body: UpdateLeadInput) =>
      request<LeadDTO>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    scoreLead: (id: string) =>
      request<LeadDTO>(`/leads/${id}/score`, { method: 'POST' }),
    generateOutreach: (id: string, body: GenerateOutreachInput) =>
      request<OutreachDTO>(`/leads/${id}/outreach`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    // Campaigns + outreach hub
    listCampaigns: () => request<CampaignDTO[]>('/campaigns'),
    createCampaign: (body: CreateCampaignInput) =>
      request<CampaignDTO>('/campaigns', { method: 'POST', body: JSON.stringify(body) }),
    updateCampaign: (id: string, body: UpdateCampaignInput) =>
      request<CampaignDTO>(`/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    listOutreach: () => request<OutreachListItemDTO[]>('/outreach'),

    // Proposals
    listProposals: () => request<ProposalDTO[]>('/proposals'),
    generateProposal: (body: GenerateProposalInput) =>
      request<ProposalDTO>('/proposals/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    // Sales analytics + insights
    getSalesAnalytics: () => request<SalesAnalyticsDTO>('/sales/analytics'),
    getSalesInsights: () => request<SalesInsightsDTO>('/sales/insights'),

    // CRM connections
    listCrm: () => request<CrmConnectionDTO[]>('/crm'),
    connectCrm: (body: ConnectCrmInput) =>
      request<CrmConnectionDTO>('/crm/connect', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    disconnectCrm: (provider: CrmProvider) =>
      request<void>(`/crm/${provider}`, { method: 'DELETE' }),

    // ── Social Media Auto-Post ──
    listSocialPosts: () => request<SocialPostDTO[]>('/social/posts'),
    generateSocialPost: (body: GenerateSocialPostInput) =>
      request<SocialPostDTO>('/social/posts/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    reviewSocialPost: (id: string, body: ReviewSocialPostInput) =>
      request<SocialPostDTO>(`/social/posts/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    markSocialPosted: (id: string, body: MarkSocialPostedInput) =>
      request<SocialPostDTO>(`/social/posts/${id}/posted`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    refreshSocialMetrics: (id: string) =>
      request<SocialPostDTO>(`/social/posts/${id}/metrics/refresh`, {
        method: 'POST',
      }),
    listSocialConnections: () =>
      request<SocialConnectionDTO[]>('/social/connections'),
    connectLinkedIn: (body: ConnectLinkedInInput) =>
      request<SocialConnectionDTO>('/social/connections/linkedin', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    disconnectSocial: (provider: SocialProvider) =>
      request<void>(`/social/connections/${provider}`, { method: 'DELETE' }),
  };
}

export type ApiClient = ReturnType<typeof buildApi>;
