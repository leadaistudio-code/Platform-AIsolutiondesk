-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "lemonCustomerId" TEXT,
ADD COLUMN     "lemonSubscriptionId" TEXT,
ADD COLUMN     "lemonVariantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_lemonCustomerId_key" ON "Subscription"("lemonCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_lemonSubscriptionId_key" ON "Subscription"("lemonSubscriptionId");
