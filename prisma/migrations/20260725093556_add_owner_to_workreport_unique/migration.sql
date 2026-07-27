/*
  Warnings:

  - A unique constraint covering the columns `[reportDate,type,owner]` on the table `WorkReport` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WorkReport_reportDate_idx";

-- DropIndex
DROP INDEX "WorkReport_reportDate_type_key";

-- CreateIndex
CREATE INDEX "WorkReport_reportDate_type_idx" ON "WorkReport"("reportDate", "type");

-- CreateIndex
CREATE UNIQUE INDEX "WorkReport_reportDate_type_owner_key" ON "WorkReport"("reportDate", "type", "owner");
