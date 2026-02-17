import { describe, it, expect } from "@jest/globals";
import { prisma } from "@/lib/db/prisma";
import { transitionEscrow, createEscrow } from "@/services/escrow.service";
import { EscrowStatus } from "@prisma/client";
import { generateId } from "@/lib/utils/id";

// Mocking required services to avoid side effects
jest.mock("@/services/reputation.service", () => ({
  updateUserReputation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/notification.service", () => ({
  NotificationService: {
    createNotification: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@/services/agent.service", () => ({
  submitTaskWithRetry: jest.fn().mockResolvedValue(undefined),
}));

describe("State Transitions", () => {
  // We'll use a real database connection for this test as it's an integration test
  // ensuring the DB write actually happens with all fields

  it("should log toState in stateTransition table", async () => {
    // 1. Create a temporary test user and escrow
    const buyerId = generateId();
    const sellerId = generateId();

    // Create users directly in DB to avoid auth service overhead
    await prisma.user.create({
      data: {
        id: buyerId,
        email: `test-buyer-${buyerId}@example.com`,
        role: "CLIENT",
        passwordHash: "hashed_password",
      },
    });

    await prisma.user.create({
      data: {
        id: sellerId,
        email: `test-seller-${sellerId}@example.com`,
        role: "FREELANCER",
        passwordHash: "hashed_password",
      },
    });

    // Create escrow directly to be in CREATED state
    const escrow = await prisma.escrow.create({
      data: {
        id: generateId(),
        escrowId: `TEST-${generateId()}`,
        buyerUserId: buyerId,
        sellerUserId: sellerId,
        amountBCH: 0.1,
        description: "Test Escrow",
        status: EscrowStatus.CREATED,
        escrowAddress: "bchtest:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
        privateKeyEncrypted: "mock_key",
      },
    });

    // 2. Transition to AWAITING_FUNDING via service
    await transitionEscrow(escrow.id, EscrowStatus.AWAITING_FUNDING, buyerId, {
      method: "test",
    });

    // 3. Verify state transition was logged with toState
    const stateTransition = await prisma.stateTransition.findFirst({
      where: {
        escrowId: escrow.id,
        toState: EscrowStatus.AWAITING_FUNDING,
      },
    });

    expect(stateTransition).toBeTruthy();
    expect(stateTransition?.toState).toBe(EscrowStatus.AWAITING_FUNDING);
    expect(stateTransition?.fromState).toBe(EscrowStatus.CREATED);

    // Cleanup
    await prisma.stateTransition.deleteMany({ where: { escrowId: escrow.id } });
    await prisma.escrow.delete({ where: { id: escrow.id } });
    await prisma.user.delete({ where: { id: buyerId } });
    await prisma.user.delete({ where: { id: sellerId } });
  });
});
