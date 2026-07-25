export abstract class WalletBaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      errorCode: this.errorCode,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export class InsufficientBalanceError extends WalletBaseError {
  readonly statusCode = 400;
  readonly errorCode = 'INSUFFICIENT_BALANCE';

  constructor(
    public readonly availableBalance: number,
    public readonly requestedAmount: number
  ) {
    super(`Insufficient wallet balance. Available: ₦${availableBalance.toFixed(2)}, Requested: ₦${requestedAmount.toFixed(2)}`);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      availableBalance: this.availableBalance,
      requestedAmount: this.requestedAmount,
    };
  }
}

export class WalletNotFoundError extends WalletBaseError {
  readonly statusCode = 404;
  readonly errorCode = 'WALLET_NOT_FOUND';

  constructor(userId: string) {
    super(`Wallet not found for user ID: ${userId}`);
  }
}

export class WalletSuspendedError extends WalletBaseError {
  readonly statusCode = 403;
  readonly errorCode = 'WALLET_SUSPENDED';

  constructor(userId: string) {
    super(`User account or wallet is suspended for user ID: ${userId}`);
  }
}

export class DuplicateReferenceError extends WalletBaseError {
  readonly statusCode = 409;
  readonly errorCode = 'DUPLICATE_TRANSACTION_REFERENCE';

  constructor(reference: string) {
    super(`Transaction with reference '${reference}' has already been processed.`);
  }
}

export class InvalidAmountError extends WalletBaseError {
  readonly statusCode = 400;
  readonly errorCode = 'INVALID_AMOUNT';

  constructor(amount: number) {
    super(`Invalid operation amount: ₦${amount}. Amount must be greater than zero.`);
  }
}
