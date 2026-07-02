/*
  Warnings:

  - Made the column `filePath` on table `Ebook` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Ebook" ALTER COLUMN "filePath" SET NOT NULL;
