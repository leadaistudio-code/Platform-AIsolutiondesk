-- CreateEnum
CREATE TYPE "MarketingContentType" AS ENUM ('BLOG_POST', 'EMAIL', 'AD_COPY', 'SOCIAL_POST', 'LANDING_PAGE', 'NEWSLETTER', 'PRODUCT_DESCRIPTION');

-- CreateEnum
CREATE TYPE "MarketingContentStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "MarketingContent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "MarketingContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metaDescription" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoScore" INTEGER,
    "channel" TEXT,
    "status" "MarketingContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingBrandProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brandName" TEXT,
    "description" TEXT,
    "tone" TEXT,
    "audience" TEXT,
    "valueProps" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "doNotMention" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingBrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingContent_organizationId_type_status_idx" ON "MarketingContent"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "MarketingContent_organizationId_createdAt_idx" ON "MarketingContent"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingBrandProfile_organizationId_key" ON "MarketingBrandProfile"("organizationId");

-- AddForeignKey
ALTER TABLE "MarketingContent" ADD CONSTRAINT "MarketingContent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingBrandProfile" ADD CONSTRAINT "MarketingBrandProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
