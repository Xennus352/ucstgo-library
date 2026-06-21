-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "createdById" TEXT;

-- CreateIndex
CREATE INDEX "Book_createdById_idx" ON "Book"("createdById");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
