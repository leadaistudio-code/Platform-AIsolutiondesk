/**
 * Seeds a demo tenant so you can explore the app without configuring Clerk.
 * Safe to run repeatedly — everything is upserted by a stable key.
 *
 *   pnpm db:seed
 */
import { PrismaClient, Role, Product, TicketPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1) Demo organization (tenant) with all three products enabled.
  const org = await prisma.organization.upsert({
    where: { clerkOrgId: 'org_demo' },
    create: {
      clerkOrgId: 'org_demo',
      name: 'Acme Corp (Demo)',
      slug: 'acme-demo',
      products: [Product.SERVICE_DESK, Product.EMPLOYEE_ASSISTANT, Product.SALES_AGENT],
    },
    update: {},
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

  console.log(`✅ Seeded demo org "${org.name}" (${org.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
