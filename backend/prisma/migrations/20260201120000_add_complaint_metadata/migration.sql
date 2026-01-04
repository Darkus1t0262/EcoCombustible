-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN "stationId" INTEGER;
ALTER TABLE "Complaint" ADD COLUMN "source" TEXT;
ALTER TABLE "Complaint" ADD COLUMN "reporterName" TEXT;
ALTER TABLE "Complaint" ADD COLUMN "reporterRole" TEXT;
ALTER TABLE "Complaint" ADD COLUMN "vehiclePlate" TEXT;
ALTER TABLE "Complaint" ADD COLUMN "vehicleModel" TEXT;
ALTER TABLE "Complaint" ADD COLUMN "fuelType" TEXT;
ALTER TABLE "Complaint" ADD COLUMN "liters" DOUBLE PRECISION;
ALTER TABLE "Complaint" ADD COLUMN "unitPrice" DOUBLE PRECISION;
ALTER TABLE "Complaint" ADD COLUMN "totalAmount" DOUBLE PRECISION;
ALTER TABLE "Complaint" ADD COLUMN "occurredAt" TIMESTAMP(3);
ALTER TABLE "Complaint" ADD COLUMN "resolvedAt" TIMESTAMP(3);
ALTER TABLE "Complaint" ADD COLUMN "resolutionNote" TEXT;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;
