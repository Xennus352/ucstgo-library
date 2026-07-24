/*
  Warnings:

  - You are about to drop the `academic_resource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "academic_resource" DROP CONSTRAINT "academic_resource_createdById_fkey";

-- DropTable
DROP TABLE "academic_resource";
