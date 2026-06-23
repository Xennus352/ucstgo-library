-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "senderId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Notification_senderId_idx" ON "Notification"("senderId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
