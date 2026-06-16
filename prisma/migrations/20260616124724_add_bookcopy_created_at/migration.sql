/*
  Warnings:

  - You are about to drop the column `description` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BookCopy" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "description";
