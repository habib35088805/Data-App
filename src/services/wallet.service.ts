import { Prisma, LedgerType, UserStatus } from '@prisma/client';
import { prisma } from '../config/db';
import {
  DebitWalletParams,
  CreditWalletParams,
  WalletBalanceResult,
  WalletLockedRow,
  UserStatusLockedRow,
} from '../types/wallet';
import {
  InsufficientBalanceError,
  WalletNotFoundError,
  WalletSuspendedError,
  DuplicateReferenceError,
  InvalidAmountError,
} from '../errors/wallet.errors';

export class WalletService {
  /**
   * Performs an atomic double-entry DEBIT on a user's wallet.
   * Utilizes database row-level locking (FOR UPDATE) inside an interactive transaction
   * to eliminate race conditions, double-spending, and negative balance anomalies.
   */
  public static async debit(params: DebitWalletParams): Promise<WalletBalanceResult> {
    const { userId, amount, reference, description } = params;

    if (amount <= 0) {
      throw new InvalidAmountError(amount);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check: Prevent duplicate debit using unique reference
      const existingEntry = await tx.ledgerEntry.findUnique({
        where: { reference },
      });
      if (existingEntry) {
        throw new DuplicateReferenceError(reference);
      }

      // 2. Validate User Account Status
      const users = await tx.$queryRaw<UserStatusLockedRow[]>`
        SELECT id, status FROM "users" WHERE id = ${userId} FOR UPDATE
      `;
      if (!users || users.length === 0) {
        throw new WalletNotFoundError(userId);
      }
      if (users[0].status !== UserStatus.ACTIVE) {
        throw new WalletSuspendedError(userId);
      }

      // 3. Acquire Row-Level Lock (FOR UPDATE) on Wallet Row
      const wallets = await tx.$queryRaw<WalletLockedRow[]>`
        SELECT id, user_id, balance FROM "wallets" WHERE user_id = ${userId} FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new WalletNotFoundError(userId);
      }

      const wallet = wallets[0];
      const previousBalance = new Prisma.Decimal(wallet.balance).toNumber();
      const debitAmount = new Prisma.Decimal(amount).toNumber();

      // 4. Strict Balance Validation
      if (previousBalance < debitAmount) {
        throw new InsufficientBalanceError(previousBalance, debitAmount);
      }

      const newBalance = new Prisma.Decimal(previousBalance - debitAmount)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        .toNumber();

      // 5. Update Wallet Balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      // 6. Record Double-Entry Ledger Record
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerType.DEBIT,
          amount: debitAmount,
          balanceBefore: previousBalance,
          balanceAfter: newBalance,
          reference,
          description,
        },
      });

      return {
        walletId: wallet.id,
        userId,
        previousBalance,
        newBalance,
        amount: debitAmount,
        reference,
        ledgerEntryId: ledgerEntry.id,
        type: LedgerType.DEBIT,
        timestamp: ledgerEntry.createdAt,
      };
    });
  }

  /**
   * Performs an atomic double-entry CREDIT on a user's wallet.
   * Utilizes database row-level locking (FOR UPDATE) inside an interactive transaction.
   */
  public static async credit(params: CreditWalletParams): Promise<WalletBalanceResult> {
    const { userId, amount, reference, description } = params;

    if (amount <= 0) {
      throw new InvalidAmountError(amount);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check: Prevent duplicate credit using unique reference
      const existingEntry = await tx.ledgerEntry.findUnique({
        where: { reference },
      });
      if (existingEntry) {
        throw new DuplicateReferenceError(reference);
      }

      // 2. Validate User Account Status
      const users = await tx.$queryRaw<UserStatusLockedRow[]>`
        SELECT id, status FROM "users" WHERE id = ${userId} FOR UPDATE
      `;
      if (!users || users.length === 0) {
        throw new WalletNotFoundError(userId);
      }
      if (users[0].status !== UserStatus.ACTIVE) {
        throw new WalletSuspendedError(userId);
      }

      // 3. Acquire Row-Level Lock (FOR UPDATE) on Wallet Row
      const wallets = await tx.$queryRaw<WalletLockedRow[]>`
        SELECT id, user_id, balance FROM "wallets" WHERE user_id = ${userId} FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new WalletNotFoundError(userId);
      }

      const wallet = wallets[0];
      const previousBalance = new Prisma.Decimal(wallet.balance).toNumber();
      const creditAmount = new Prisma.Decimal(amount).toNumber();

      const newBalance = new Prisma.Decimal(previousBalance + creditAmount)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        .toNumber();

      // 4. Update Wallet Balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      // 5. Record Double-Entry Ledger Record
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerType.CREDIT,
          amount: creditAmount,
          balanceBefore: previousBalance,
          balanceAfter: newBalance,
          reference,
          description,
        },
      });

      return {
        walletId: wallet.id,
        userId,
        previousBalance,
        newBalance,
        amount: creditAmount,
        reference,
        ledgerEntryId: ledgerEntry.id,
        type: LedgerType.CREDIT,
        timestamp: ledgerEntry.createdAt,
      };
    });
  }

  /**
   * Retrieves wallet details for a user.
   */
  public static async getWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { user: { select: { id: true, fullName: true, email: true, status: true } } },
    });

    if (!wallet) {
      throw new WalletNotFoundError(userId);
    }

    return wallet;
  }

  /**
   * Retrieves paginated ledger history for a wallet.
   */
  public static async getLedgerHistory(walletId: string, limit = 20, offset = 0) {
    return await prisma.ledgerEntry.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
