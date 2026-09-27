-- AlterTable
ALTER TABLE "DailyReport" ADD COLUMN     "feedBags" DOUBLE PRECISION,
ADD COLUMN     "mortalityDay" INTEGER,
ADD COLUMN     "mortalityNight" INTEGER;

-- CreateTable
CREATE TABLE "DailyStock" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "feedBags" DOUBLE PRECISION,
    "dieselLitres" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "DailyStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyStock_farmerId_date_idx" ON "DailyStock"("farmerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStock_farmerId_date_key" ON "DailyStock"("farmerId", "date");

-- AddForeignKey
ALTER TABLE "DailyStock" ADD CONSTRAINT "DailyStock_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

