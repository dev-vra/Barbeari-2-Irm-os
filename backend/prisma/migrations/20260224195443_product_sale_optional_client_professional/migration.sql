-- DropForeignKey
ALTER TABLE "product_sales" DROP CONSTRAINT "product_sales_clientId_fkey";

-- DropForeignKey
ALTER TABLE "product_sales" DROP CONSTRAINT "product_sales_professionalId_fkey";

-- AlterTable
ALTER TABLE "product_sales" ALTER COLUMN "clientId" DROP NOT NULL,
ALTER COLUMN "professionalId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "product_sales" ADD CONSTRAINT "product_sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sales" ADD CONSTRAINT "product_sales_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
