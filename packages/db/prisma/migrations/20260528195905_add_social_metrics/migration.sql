-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "linkedinPostUrn" TEXT,
ADD COLUMN     "metrics" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "metricsLastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "xTweetId" TEXT;
