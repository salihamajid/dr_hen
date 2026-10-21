-- CreateEnum
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
-- CreateEnum
CREATE TYPE "BroadcastKind" AS ENUM ('MESSAGE', 'VIDEO', 'TEMPLATE');
-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'PARTIAL', 'FAILED');
-- CreateEnum
CREATE TYPE "FeedOrderStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'DELIVERED', 'CANCELLED');
-- CreateEnum
CREATE TYPE "AdminNotificationKind" AS ENUM ('CRITICAL_ALERT', 'VET_ESCALATION', 'BROADCAST_FAILED', 'FEED_ORDER');
-- AlterTable
ALTER TABLE "Flock" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryError" TEXT,
ADD COLUMN     "deliveryStatus" "MessageDeliveryStatus";
-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "kind" "BroadcastKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "mediaUrl" TEXT,
    "templateName" TEXT,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "messageId" TEXT,
    "status" "MessageDeliveryStatus",
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "FeedOrder" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "bags" INTEGER NOT NULL,
    "note" TEXT,
    "status" "FeedOrderStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    CONSTRAINT "FeedOrder_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "kind" "AdminNotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "farmerId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "Broadcast_createdAt_idx" ON "Broadcast"("createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "BroadcastRecipient_messageId_key" ON "BroadcastRecipient"("messageId");
-- CreateIndex
CREATE INDEX "BroadcastRecipient_farmerId_idx" ON "BroadcastRecipient"("farmerId");
-- CreateIndex
CREATE UNIQUE INDEX "BroadcastRecipient_broadcastId_farmerId_key" ON "BroadcastRecipient"("broadcastId", "farmerId");
-- CreateIndex
CREATE INDEX "FeedOrder_farmerId_status_idx" ON "FeedOrder"("farmerId", "status");
-- CreateIndex
CREATE INDEX "FeedOrder_status_createdAt_idx" ON "FeedOrder"("status", "createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "AdminNotification_dedupeKey_key" ON "AdminNotification"("dedupeKey");
-- CreateIndex
CREATE INDEX "AdminNotification_readAt_createdAt_idx" ON "AdminNotification"("readAt", "createdAt");
-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "FeedOrder" ADD CONSTRAINT "FeedOrder_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing flock would otherwise read as "registered today", which would
-- inflate the admin dashboard's "new flocks this month". The arrival date is the closest
-- honest stand-in for when the record was made.
UPDATE "Flock" SET "createdAt" = "startDate" WHERE "startDate" < "createdAt";
