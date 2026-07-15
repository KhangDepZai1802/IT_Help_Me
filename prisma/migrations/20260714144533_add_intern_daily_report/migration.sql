-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "internId" TEXT NOT NULL DEFAULT '',
    "mentor" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "team" TEXT NOT NULL DEFAULT '',
    "project" TEXT NOT NULL DEFAULT '',
    "learnedItems" TEXT[],
    "learnedChecklist" JSONB NOT NULL DEFAULT '{}',
    "learnedOther" TEXT NOT NULL DEFAULT '',
    "appliedItems" TEXT[],
    "appliedChecklist" JSONB NOT NULL DEFAULT '{}',
    "appliedOther" TEXT NOT NULL DEFAULT '',
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "achievements" JSONB NOT NULL DEFAULT '{}',
    "difficulties" TEXT[],
    "planTomorrow" TEXT[],
    "selfRating" JSONB NOT NULL DEFAULT '{}',
    "selfNote" TEXT NOT NULL DEFAULT '',
    "mentorComment" TEXT NOT NULL DEFAULT '',
    "mentorOverallRating" INTEGER NOT NULL DEFAULT 0,
    "mentorSignature" TEXT NOT NULL DEFAULT '',
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyReport_internId_reportDate_idx" ON "DailyReport"("internId", "reportDate");
