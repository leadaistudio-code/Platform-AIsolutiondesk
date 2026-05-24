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
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface ProductNav {
  key: 'service-desk' | 'employee-assistant' | 'sales-agent';
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
];
