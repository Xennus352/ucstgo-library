-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('Y1_SEM1', 'Y1_SEM2', 'Y2_SEM1', 'Y2_SEM2', 'Y3_SEM1', 'Y3_SEM2', 'Y4_SEM1', 'Y4_SEM2');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "donate" TEXT;

-- AlterTable
ALTER TABLE "Ebook" ADD COLUMN     "semester" "Semester";
