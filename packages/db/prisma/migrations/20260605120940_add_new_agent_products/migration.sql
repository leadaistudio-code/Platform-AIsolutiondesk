-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Product" ADD VALUE 'CUSTOMER_SUPPORT';
ALTER TYPE "Product" ADD VALUE 'FINANCE';
ALTER TYPE "Product" ADD VALUE 'FINANCE_ANALYSIS';
ALTER TYPE "Product" ADD VALUE 'MARKETING_SEO';
