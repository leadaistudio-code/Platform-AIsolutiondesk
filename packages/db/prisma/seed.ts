/**
 * Seeds a demo tenant so you can explore the app without configuring Clerk.
 * Safe to run repeatedly — everything is upserted by a stable key.
 *
 *   pnpm db:seed
 */
import { PrismaClient, Role, Product, TicketPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1) Demo organization (tenant) with ALL products enabled so every agent
  //    module is visible in the dashboard.
  const allProducts = [
    Product.SERVICE_DESK,
    Product.EMPLOYEE_ASSISTANT,
    Product.SOCIAL_MEDIA,
    Product.SALES_AGENT,
    Product.CUSTOMER_SUPPORT,
    Product.FINANCE,
    Product.FINANCE_ANALYSIS,
    Product.MARKETING_SEO,
  ];
  const org = await prisma.organization.upsert({
    where: { clerkOrgId: 'org_demo' },
    create: {
      clerkOrgId: 'org_demo',
      name: 'Acme Corp (Demo)',
      slug: 'acme-demo',
      products: allProducts,
    },
    // Keep products in sync on re-seed so existing demo orgs get every module.
    update: { products: allProducts },
  });

  // 2) Demo owner user + membership.
  const user = await prisma.user.upsert({
    where: { clerkUserId: 'user_demo' },
    create: {
      clerkUserId: 'user_demo',
      email: 'owner@acme-demo.test',
      name: 'Demo Owner',
    },
    update: {},
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: { organizationId: org.id, userId: user.id },
    },
    create: { organizationId: org.id, userId: user.id, role: Role.OWNER },
    update: { role: Role.OWNER },
  });

  // 3) Subscription (Pro trial).
  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    create: { organizationId: org.id, tier: 'PRO', status: 'TRIALING', seats: 10 },
    update: {},
  });

  // 4) SLA policies (one per priority) for the Service Desk.
  const slas: Array<{ priority: TicketPriority; response: number; resolution: number }> = [
    { priority: TicketPriority.CRITICAL, response: 15, resolution: 240 },
    { priority: TicketPriority.HIGH, response: 60, resolution: 480 },
    { priority: TicketPriority.MEDIUM, response: 240, resolution: 1440 },
    { priority: TicketPriority.LOW, response: 480, resolution: 2880 },
  ];
  for (const s of slas) {
    await prisma.slaPolicy.upsert({
      where: { organizationId_priority: { organizationId: org.id, priority: s.priority } },
      create: {
        organizationId: org.id,
        name: `${s.priority} SLA`,
        priority: s.priority,
        responseMinutes: s.response,
        resolutionMinutes: s.resolution,
      },
      update: {},
    });
  }

  // 5) Departments for the Employee Assistant.
  for (const name of ['HR', 'IT', 'Finance']) {
    await prisma.department.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      create: { organizationId: org.id, name, accessTags: [name.toLowerCase()] },
      update: {},
    });
  }

  // 6) A couple of sample tickets and leads (only if none exist yet).
  const ticketCount = await prisma.ticket.count({ where: { organizationId: org.id } });
  if (ticketCount === 0) {
    await prisma.ticket.createMany({
      data: [
        {
          organizationId: org.id,
          subject: 'VPN keeps disconnecting',
          description: 'Since the update this morning my VPN drops every 10 minutes.',
          priority: TicketPriority.HIGH,
          requesterEmail: 'jane@acme-demo.test',
        },
        {
          organizationId: org.id,
          subject: 'Request new laptop',
          description: 'Starting a new hire Monday, need a laptop provisioned.',
          priority: TicketPriority.MEDIUM,
          requesterEmail: 'manager@acme-demo.test',
        },
      ],
    });
  }

  const leadCount = await prisma.lead.count({ where: { organizationId: org.id } });
  if (leadCount === 0) {
    await prisma.lead.createMany({
      data: [
        { organizationId: org.id, fullName: 'Priya Sharma', company: 'Globex', email: 'priya@globex.test', title: 'VP Engineering' },
        { organizationId: org.id, fullName: 'Tom Reilly', company: 'Initech', email: 'tom@initech.test', title: 'IT Director' },
      ],
    });
  }

  // 7) Twelve months of financial snapshots for the AI Finance Analysis agent.
  //    Revenue grows faster than expenses so the org moves from burn to profit.
  const now = new Date();
  const startMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  let cash = 1_200_000;
  for (let i = 11; i >= 0; i--) {
    const period = new Date(
      Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() - i, 1),
    );
    const monthIdx = 11 - i; // 0..11, oldest → newest
    const revenue = Math.round(120_000 * Math.pow(1.06, monthIdx));
    const expenses = Math.round(150_000 * Math.pow(1.02, monthIdx));
    cash += revenue - expenses;
    await prisma.financialSnapshot.upsert({
      where: { organizationId_period: { organizationId: org.id, period } },
      create: {
        organizationId: org.id,
        period,
        revenue,
        expenses,
        cash,
        newCustomers: 18 + monthIdx * 2,
        churnedCustomers: Math.max(2, 8 - Math.floor(monthIdx / 2)),
      },
      update: { revenue, expenses, cash },
    });
  }

  // 8) Marketing brand voice + a couple of sample content pieces.
  await prisma.marketingBrandProfile.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      brandName: 'AISOLUTIONDESK',
      description: 'An AI workforce platform that automates support, sales, finance, and marketing.',
      tone: 'confident, helpful, no fluff',
      audience: 'B2B operations and IT leaders at scaling companies',
      valueProps: 'Deploy in minutes; enterprise-grade security; 24/7 AI agents; compounding ROI',
      keywords: ['AI workforce', 'AI agents', 'automation platform', 'AI service desk'],
      doNotMention: 'competitor names',
    },
    update: {},
  });

  const contentCount = await prisma.marketingContent.count({ where: { organizationId: org.id } });
  if (contentCount === 0) {
    await prisma.marketingContent.createMany({
      data: [
        {
          organizationId: org.id,
          type: 'BLOG_POST',
          title: 'How AI Service Desks Cut Ticket Volume by 60%',
          brief: 'Blog post on deflecting repetitive IT tickets with AI',
          body: '# How AI Service Desks Cut Ticket Volume by 60%\n\nRepetitive tickets drown support teams...',
          metaDescription: 'See how an AI service desk auto-resolves repetitive tickets and frees your team.',
          keywords: ['AI service desk', 'ticket deflection', 'IT support automation'],
          status: 'PUBLISHED',
          channel: 'Blog',
        },
        {
          organizationId: org.id,
          type: 'EMAIL',
          title: 'Launch announcement: meet your AI workforce',
          brief: 'Product launch email to existing leads',
          body: 'Subject: Your new AI workforce is live\n\nHi there,\n\nWe just shipped...',
          metaDescription: null,
          keywords: ['AI workforce', 'product launch'],
          status: 'DRAFT',
          channel: 'Email',
        },
      ],
    });
  }

  console.log(`✅ Seeded demo org "${org.name}" (${org.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
