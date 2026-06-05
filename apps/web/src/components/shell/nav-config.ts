import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Sparkles,
  BookOpen,
  Workflow,
  Plug,
  Settings,
  MessageSquare,
  FileText,
  Brain,
  Database,
  Users,
  ShieldCheck,
  Activity,
  Megaphone,
  RefreshCw,
  Send,
  FileSignature,
  Lightbulb,
  Share2,
  PenSquare,
  CheckSquare,
  Palette,
  Headset,
  Inbox,
  Receipt,
  Wallet,
  LineChart,
  TrendingUp,
  PenTool,
  Search,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface ProductNav {
  key:
    | 'service-desk'
    | 'employee-assistant'
    | 'sales-agent'
    | 'social-media'
    | 'customer-support'
    | 'finance'
    | 'finance-analysis'
    | 'marketing-seo';
  name: string;
  tagline: string;
  items: NavItem[];
}

/**
 * The full navigation map. The sidebar renders the sections for whichever
 * products the current organization has enabled. Routes match the pages listed
 * in the product brief.
 */
export const PRODUCTS: ProductNav[] = [
  {
    key: 'social-media',
    name: 'AI Social Media',
    tagline: 'Auto-post + approvals',
    items: [
      { label: 'Feed', href: '/social', icon: Share2 },
      { label: 'Generate Post', href: '/social/new', icon: PenSquare },
      { label: 'Approvals', href: '/social/approvals', icon: CheckSquare },
      { label: 'Brand Persona', href: '/social/persona', icon: Palette },
      { label: 'Connections', href: '/social/connections', icon: Plug },
    ],
  },
  {
    key: 'service-desk',
    name: 'AI Service Desk',
    tagline: 'IT support & incidents',
    items: [
      { label: 'Dashboard', href: '/service-desk', icon: LayoutDashboard },
      { label: 'Tickets', href: '/service-desk/tickets', icon: Ticket },
      { label: 'Incident Analytics', href: '/service-desk/analytics', icon: BarChart3 },
      { label: 'AI Recommendations', href: '/service-desk/recommendations', icon: Sparkles },
      { label: 'Knowledge Base', href: '/service-desk/knowledge', icon: BookOpen },
      { label: 'Workflows', href: '/service-desk/workflows', icon: Workflow },
      { label: 'Integrations', href: '/service-desk/integrations', icon: Plug },
      { label: 'Settings', href: '/service-desk/settings', icon: Settings },
    ],
  },
  {
    key: 'employee-assistant',
    name: 'AI Employee Assistant',
    tagline: 'Internal knowledge',
    items: [
      { label: 'Chat Workspace', href: '/assistant', icon: MessageSquare },
      { label: 'Documents', href: '/assistant/documents', icon: FileText },
      { label: 'AI Memory', href: '/assistant/memory', icon: Brain },
      { label: 'Knowledge Sources', href: '/assistant/sources', icon: Database },
      { label: 'Teams', href: '/assistant/teams', icon: Users },
      { label: 'Permissions', href: '/assistant/permissions', icon: ShieldCheck },
      { label: 'Usage Analytics', href: '/assistant/analytics', icon: Activity },
    ],
  },
  {
    key: 'sales-agent',
    name: 'AI Sales Agent',
    tagline: 'Outreach & pipeline',
    items: [
      { label: 'Leads', href: '/sales', icon: LayoutDashboard },
      { label: 'Campaigns', href: '/sales/campaigns', icon: Megaphone },
      { label: 'CRM Sync', href: '/sales/crm', icon: RefreshCw },
      { label: 'AI Outreach', href: '/sales/outreach', icon: Send },
      { label: 'Proposal Generator', href: '/sales/proposals', icon: FileSignature },
      { label: 'Analytics', href: '/sales/analytics', icon: BarChart3 },
      { label: 'AI Insights', href: '/sales/insights', icon: Lightbulb },
    ],
  },
  {
    key: 'customer-support',
    name: 'AI Customer Support',
    tagline: 'External CX & helpdesk',
    items: [
      { label: 'Overview', href: '/customer-support', icon: LayoutDashboard },
      { label: 'Conversations', href: '/customer-support/conversations', icon: Inbox },
      { label: 'Knowledge Base', href: '/customer-support/knowledge', icon: BookOpen },
    ],
  },
  {
    key: 'finance',
    name: 'AI Finance Agent',
    tagline: 'AP, AR & expenses',
    items: [
      { label: 'Overview', href: '/finance', icon: LayoutDashboard },
      { label: 'Invoices', href: '/finance/invoices', icon: Receipt },
      { label: 'Expenses', href: '/finance/expenses', icon: Wallet },
    ],
  },
  {
    key: 'finance-analysis',
    name: 'AI Finance Analysis',
    tagline: 'Reporting & forecasting',
    items: [
      { label: 'Overview', href: '/finance-analysis', icon: LayoutDashboard },
      { label: 'Reports', href: '/finance-analysis/reports', icon: LineChart },
      { label: 'Forecasts', href: '/finance-analysis/forecasts', icon: TrendingUp },
    ],
  },
  {
    key: 'marketing-seo',
    name: 'AI Marketing & SEO',
    tagline: 'Content & growth',
    items: [
      { label: 'Overview', href: '/marketing', icon: LayoutDashboard },
      { label: 'Content Studio', href: '/marketing/content', icon: PenTool },
      { label: 'SEO Planner', href: '/marketing/seo', icon: Search },
    ],
  },
];
