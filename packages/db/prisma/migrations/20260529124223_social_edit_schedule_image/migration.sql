-- AlterEnum
ALTER TYPE "SocialPostStatus" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "imageData" BYTEA,
ADD COLUMN     "imageMimeType" TEXT,
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "scheduledPlatforms" TEXT[] DEFAULT ARRAY[]::TEXT[];
