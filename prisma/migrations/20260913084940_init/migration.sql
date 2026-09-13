-- CreateEnum
CREATE TYPE "FarmerStatus" AS ENUM ('HEALTHY', 'AT_RISK', 'UNDER_TREATMENT', 'ESCALATED');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DiseaseCode" AS ENUM ('ND', 'IB', 'CRD', 'COCCIDIOSIS', 'AI_H9', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'IMAGE', 'VOICE', 'VIDEO', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('FARMER', 'AI_AGENT', 'ADMIN', 'FIELD_VET');

-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "flockSize" INTEGER NOT NULL,
    "numberOfSheds" INTEGER NOT NULL,
    "flockAgeWeeks" INTEGER NOT NULL,
    "breed" TEXT NOT NULL,
    "status" "FarmerStatus" NOT NULL DEFAULT 'HEALTHY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flock" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "sizeCount" INTEGER NOT NULL,
    "ageWeeks" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Flock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "flockId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fcr" DOUBLE PRECISION,
    "avgWeightGrams" DOUBLE PRECISION,
    "mortalityCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineProtocol" (
    "id" TEXT NOT NULL,
    "diseaseCode" "DiseaseCode" NOT NULL,
    "diseaseName" TEXT NOT NULL,
    "primaryMedicines" JSONB NOT NULL,
    "supportMedicines" JSONB,
    "notes" TEXT,
    "isAntibiotic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MedicineProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "flockId" TEXT,
    "diseaseCode" "DiseaseCode" NOT NULL,
    "medicinesGiven" JSONB NOT NULL,
    "status" "TreatmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextActionAt" TIMESTAMP(3),
    "nextActionNote" TEXT,
    "sourceMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "flockId" TEXT,
    "vaccineName" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "administeredDate" TIMESTAMP(3),
    "status" "TreatmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
    "direction" "MessageDirection" NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "contentType" "MessageContentType" NOT NULL,
    "textContent" TEXT,
    "mediaUrl" TEXT,
    "detectedLanguage" TEXT,
    "aiDiagnosis" JSONB,
    "whatsappMessageId" TEXT,
    "rawWebhookPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldVet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FieldVet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetEscalation" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "fieldVetId" TEXT,
    "triggerMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_whatsappNumber_key" ON "Farmer"("whatsappNumber");

-- CreateIndex
CREATE INDEX "Flock_farmerId_idx" ON "Flock"("farmerId");

-- CreateIndex
CREATE INDEX "DailyReport_farmerId_date_idx" ON "DailyReport"("farmerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_name_key" ON "Medicine"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineProtocol_diseaseCode_key" ON "MedicineProtocol"("diseaseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Treatment_sourceMessageId_key" ON "Treatment"("sourceMessageId");

-- CreateIndex
CREATE INDEX "Treatment_farmerId_status_idx" ON "Treatment"("farmerId", "status");

-- CreateIndex
CREATE INDEX "Vaccination_farmerId_status_idx" ON "Vaccination"("farmerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Message_whatsappMessageId_key" ON "Message"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "Message_farmerId_createdAt_idx" ON "Message"("farmerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Flock" ADD CONSTRAINT "Flock_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "Flock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "Flock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "Flock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetEscalation" ADD CONSTRAINT "VetEscalation_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetEscalation" ADD CONSTRAINT "VetEscalation_fieldVetId_fkey" FOREIGN KEY ("fieldVetId") REFERENCES "FieldVet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
