-- AlterTable
ALTER TABLE "PasswordResetRequest" ADD COLUMN     "requestedPassword" TEXT;

-- CreateIndex
CREATE INDEX "PasswordResetRequest_token_idx" ON "PasswordResetRequest"("token");
