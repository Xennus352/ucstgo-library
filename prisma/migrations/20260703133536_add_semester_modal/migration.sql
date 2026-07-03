/*
  Warnings:

  - You are about to drop the column `semester` on the `Ebook` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ebook" DROP COLUMN "semester",
ADD COLUMN     "semesterId" TEXT;

-- DropEnum
DROP TYPE "Semester";

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Semester_name_key" ON "Semester"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_slug_key" ON "Semester"("slug");

-- CreateIndex
CREATE INDEX "Semester_name_idx" ON "Semester"("name");

-- AddForeignKey
ALTER TABLE "Ebook" ADD CONSTRAINT "Ebook_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
