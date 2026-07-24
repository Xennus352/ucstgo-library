-- CreateTable
CREATE TABLE "academic_resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "link" TEXT,
    "category" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_resource_resourceType_idx" ON "academic_resource"("resourceType");

-- CreateIndex
CREATE INDEX "academic_resource_category_idx" ON "academic_resource"("category");

-- AddForeignKey
ALTER TABLE "academic_resource" ADD CONSTRAINT "academic_resource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
