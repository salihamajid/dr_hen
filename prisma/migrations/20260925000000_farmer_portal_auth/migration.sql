-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FARMER');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'UR');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'ALERT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "VentilationLevel" AS ENUM ('POOR', 'AVERAGE', 'GOOD');

-- AlterEnum
ALTER TYPE "MessageChannel" ADD VALUE 'IN_APP';

-- AlterTable
ALTER TABLE "DailyReport" ADD COLUMN     "feedKg" DOUBLE PRECISION,
ADD COLUMN     "humidityPct" DOUBLE PRECISION,
ADD COLUMN     "lightHours" DOUBLE PRECISION,
ADD COLUMN     "medicineGiven" TEXT,
ADD COLUMN     "temperatureC" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "ventilation" "VentilationLevel",
ADD COLUMN     "waterLiters" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "language" "Language",
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "farmerId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "flockId" TEXT,
    "code" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "titleEn" TEXT NOT NULL,
    "titleUr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "bodyUr" TEXT NOT NULL,
    "metrics" JSONB,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_farmerId_key" ON "User"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_dedupeKey_key" ON "Alert"("dedupeKey");

-- CreateIndex
CREATE INDEX "Alert_farmerId_status_createdAt_idx" ON "Alert"("farmerId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_farmerId_flockId_date_key" ON "DailyReport"("farmerId", "flockId", "date");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "Flock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

