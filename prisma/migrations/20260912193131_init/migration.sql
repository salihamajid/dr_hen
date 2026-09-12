-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "flockSize" INTEGER NOT NULL,
    "numberOfSheds" INTEGER NOT NULL,
    "flockAgeWeeks" INTEGER NOT NULL,
    "breed" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Flock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "sizeCount" INTEGER NOT NULL,
    "ageWeeks" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Flock_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "flockId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fcr" REAL,
    "avgWeightGrams" REAL,
    "mortalityCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "DailyReport_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyReport_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "Flock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "MedicineProtocol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diseaseCode" TEXT NOT NULL,
    "diseaseName" TEXT NOT NULL,
    "primaryMedicines" JSONB NOT NULL,
    "supportMedicines" JSONB,
    "notes" TEXT,
    "isAntibiotic" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "flockId" TEXT,
    "diseaseCode" TEXT NOT NULL,
    "medicinesGiven" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "nextActionAt" DATETIME,
    "nextActionNote" TEXT,
    "sourceMessageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Treatment_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Treatment_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "Flock" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Treatment_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "flockId" TEXT,
    "vaccineName" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "administeredDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    CONSTRAINT "Vaccination_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vaccination_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "Flock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "direction" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "textContent" TEXT,
    "mediaUrl" TEXT,
    "detectedLanguage" TEXT,
    "aiDiagnosis" JSONB,
    "whatsappMessageId" TEXT,
    "rawWebhookPayload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldVet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "VetEscalation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "fieldVetId" TEXT,
    "triggerMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VetEscalation_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VetEscalation_fieldVetId_fkey" FOREIGN KEY ("fieldVetId") REFERENCES "FieldVet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
