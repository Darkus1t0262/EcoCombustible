-- AlterTable
ALTER TABLE "Report" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE "Report" ADD COLUMN "error" TEXT;
