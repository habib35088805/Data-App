import { LedgerType, UserStatus, ServiceType, NetworkEnum, ProviderEnum, TransactionStatus } from '@prisma/client';

export interface WalletBalanceResult {
  walletId: string;
  userId: string;
  previousBalance: number;
  newBalance: number;
  amount: number;
  reference: string;
  ledgerEntryId: string;
  type: LedgerType;
  timestamp: Date;
}

export interface DebitWalletParams {
  userId: string;
  amount: number;
  reference: string;
  description: string;
}

export interface CreditWalletParams {
  userId: string;
  amount: number;
  reference: string;
  description: string;
}

export interface WalletLockedRow {
  id: string;
  user_id: string;
  balance: string | number;
  virtual_account_number?: string | null;
  virtual_bank_name?: string | null;
  virtual_account_name?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserStatusLockedRow {
  id: string;
  status: UserStatus;
}
