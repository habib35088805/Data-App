import { Request, Response, NextFunction } from 'express';

const activeRequestLocks = new Map<string, number>();

export class IdempotencyGuard {
  /**
   * Prevents concurrent double-tap purchases using sliding window request locks.
   */
  public static verifyIdempotency(req: Request, res: Response, next: NextFunction) {
    const idempotencyKey =
      (req.headers['idempotency-key'] as string) ||
      (req.headers['x-idempotency-key'] as string) ||
      req.body?.reference;

    if (!idempotencyKey) {
      return next();
    }

    const now = Date.now();
    const existingLockTime = activeRequestLocks.get(idempotencyKey);

    // If request with identical key arrived within 10-second lock window
    if (existingLockTime && now - existingLockTime < 10000) {
      console.warn(`[Security Guard] Blocked concurrent double-tap request with key '${idempotencyKey}'`);
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_CONCURRENT_REQUEST',
        message: 'A transaction with this reference is currently processing. Double-tapping prevented.',
      });
    }

    // Set active lock
    activeRequestLocks.set(idempotencyKey, now);

    // Clean up lock after 10 seconds
    setTimeout(() => {
      activeRequestLocks.delete(idempotencyKey);
    }, 10000);

    return next();
  }
}
