-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('MORNING', 'EVENING');

-- CreateTable
CREATE TABLE "WorkReport" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "type" "ReportType" NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "recipient" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkReport_reportDate_idx" ON "WorkReport"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkReport_reportDate_type_key" ON "WorkReport"("reportDate", "type");
