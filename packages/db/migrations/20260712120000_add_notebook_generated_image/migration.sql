-- CreateTable
CREATE TABLE "notebook_generated_image" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "byteSize" INTEGER NOT NULL,
    "aspectRatio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notebook_generated_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notebook_generated_image_notebookId_createdAt_idx" ON "notebook_generated_image"("notebookId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "notebook_generated_image" ADD CONSTRAINT "notebook_generated_image_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "notebook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
