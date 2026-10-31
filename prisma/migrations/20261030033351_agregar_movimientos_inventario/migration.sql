-- CreateEnum
CREATE TYPE "Enum_Movement_Type" AS ENUM ('INITIAL', 'ENTRY', 'EXIT');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "createdById" TEXT;

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "type" "Enum_Movement_Type" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loanItemId" TEXT,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryMovement_bookId_createdAt_idx" ON "InventoryMovement"("bookId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_userId_idx" ON "InventoryMovement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_loanItemId_type_key" ON "InventoryMovement"("loanItemId", "type");

-- CreateIndex
CREATE INDEX "Book_createdById_idx" ON "Book"("createdById");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_loanItemId_fkey" FOREIGN KEY ("loanItemId") REFERENCES "LoanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
