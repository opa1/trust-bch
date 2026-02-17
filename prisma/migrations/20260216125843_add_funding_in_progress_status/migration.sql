/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ESCROW_FUNDED', 'WORK_SUBMITTED', 'DISPUTE_OPENED', 'DISPUTE_MESSAGE', 'ESCROW_RELEASED', 'ESCROW_REFUNDED');

-- AlterEnum
ALTER TYPE "EscrowStatus" ADD VALUE 'FUNDING_IN_PROGRESS';

-- AlterTable
ALTER TABLE "Escrow" ADD COLUMN     "submissionContent" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cachedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lastBalanceUpdate" TIMESTAMP(3),
ADD COLUMN     "privateKeyEncrypted" TEXT,
ADD COLUMN     "walletAddress" TEXT,
ADD COLUMN     "walletPublicKey" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "resourceId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
