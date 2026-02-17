-- CreateTable
CREATE TABLE "ai_verifications" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "findings" JSONB NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_verifications_escrowId_idx" ON "ai_verifications"("escrowId");

-- CreateIndex
CREATE INDEX "ai_verifications_recommendation_idx" ON "ai_verifications"("recommendation");

-- AddForeignKey
ALTER TABLE "ai_verifications" ADD CONSTRAINT "ai_verifications_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
