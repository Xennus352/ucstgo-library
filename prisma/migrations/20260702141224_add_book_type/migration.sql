-- CreateEnum
CREATE TYPE "BookType" AS ENUM ('BOOK', 'EBOOK');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "type" "BookType" NOT NULL DEFAULT 'BOOK';
