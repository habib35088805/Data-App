import { NetworkEnum, ProviderEnum, ServiceType } from '@prisma/client';
import { prisma } from '../config/db';
import { WalletService } from './wallet.service';
import { IVtuProvider, VtuProviderResult } from '../providers/vtuProvider.interface';
import { InlomaxProvider } from '../providers/inlomax.provider';
import { HusmodataProvider } from '../providers/husmodata.provider';
import { VtuReconciliationQueue } from './vtuReconciliation.worker';

export interface VtuPurchaseParams {
  userId: string;
  transactionPin: string;
  serviceType: ServiceType;
  network: NetworkEnum;
  phoneNumber: string;
  amount: number;
  planId?: string; // Required for DATA purchases
  reference: string;
}

export interface VtuPurchaseResponse {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  reference: string;
  providerUsed?: ProviderEnum;
  providerReference?: string;
  amount: number;
  newBalance?: number;
  message: string;
  isRefunded?: boolean;
}

export class VtuDispatcherService {
  private primaryProvider: IVtuProvider;
  private fallbackProvider: IVtuProvider;

  constructor(primary?: IVtuProvider, fallback?: IVtuProvider) {
    this.primaryProvider = primary || new InlomaxProvider();
    this.fallbackProvider = fallback || new HusmodataProvider();
  }

  /**
   * Resilient Multi-Provider VTU Dispatch Engine
   * Executes PIN validation -> Wallet Locking & Debit -> Primary Attempt -> Fallback Attempt -> Automatic Refund on Dual Failure.
   */
  public async processPurchase(params: VtuPurchaseParams): Promise<VtuPurchaseResponse> {
    const { userId, transactionPin, serviceType, network, phoneNumber, amount, planId, reference } = params;

    console.log(`\n🚀 [VTU Dispatcher] Starting ${serviceType} purchase | User: ${userId} | Network: ${network} | Amount: ₦${amount}...`);

    // ------------------------------------------------------------------
    // STEP 1: Validate Transaction PIN
    // ------------------------------------------------------------------
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User account not found for ID: ${userId}`);
    }

    if (user.transactionPinHash !== transactionPin) {
      console.warn(`[Security Alert] Invalid transaction PIN provided for User ID: ${userId}`);
      throw new Error('INVALID_TRANSACTION_PIN: The transaction PIN provided is incorrect.');
    }

    // ------------------------------------------------------------------
    // STEP 2: Lock and Debit User Wallet Balance (Row-Level Lock FOR UPDATE)
    // ------------------------------------------------------------------
    const debitResult = await WalletService.debit({
      userId,
      amount,
      reference,
      description: `VTU ${serviceType} (${network}) for ${phoneNumber}`,
    });

    // Create Initial Transaction Record in Database (Status: PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        reference,
        serviceType,
        network,
        phoneNumber,
        planId: planId || null,
        amount,
        providerUsed: this.primaryProvider.name,
        status: 'PENDING',
      },
    });

    let providerResult: VtuProviderResult;

    // ------------------------------------------------------------------
    // STEP 3: Attempt Purchase via Primary Provider (Inlomax)
    // ------------------------------------------------------------------
    console.log(`[VTU Dispatcher] Step 3: Attempting primary dispatch via ${this.primaryProvider.name}...`);
    
    if (serviceType === ServiceType.DATA) {
      if (!planId) throw new Error('planId is required for DATA purchase.');
      providerResult = await this.primaryProvider.purchaseData(network, phoneNumber, planId);
    } else {
      providerResult = await this.primaryProvider.purchaseAirtime(network, phoneNumber, amount);
    }

    // ------------------------------------------------------------------
    // STEP 4: Fallback to Secondary Provider (Husmodata) if Primary Fails
    // ------------------------------------------------------------------
    if (providerResult.status === 'FAILED') {
      console.warn(`⚠️ [VTU Dispatcher] Primary Provider (${this.primaryProvider.name}) FAILED (${providerResult.responseMessage}). Initiating Step 4 Fallback via ${this.fallbackProvider.name}...`);

      if (serviceType === ServiceType.DATA) {
        providerResult = await this.fallbackProvider.purchaseData(network, phoneNumber, planId!);
      } else {
        providerResult = await this.fallbackProvider.purchaseAirtime(network, phoneNumber, amount);
      }
    }

    // ------------------------------------------------------------------
    // STEP 5: If BOTH Providers Fail -> Immediate Atomic Wallet REFUND
    // ------------------------------------------------------------------
    if (providerResult.status === 'FAILED') {
      console.error(`❌ [VTU Dispatcher] Dual-Provider Failure (${this.primaryProvider.name} & ${this.fallbackProvider.name} failed). Executing Step 5 Automatic Wallet Refund...`);

      const refundReference = `REFUND_${reference}`;
      
      const refundResult = await WalletService.credit({
        userId,
        amount,
        reference: refundReference,
        description: `Automatic Refund for failed VTU ${serviceType} purchase (${reference})`,
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          providerUsed: providerResult.providerName,
        },
      });

      console.log(`💰 [Automatic Refund Complete] User ID: ${userId} | Refunded ₦${amount.toFixed(2)} | Balance Restored to ₦${refundResult.newBalance.toFixed(2)}`);

      return {
        success: false,
        status: 'FAILED',
        reference,
        providerUsed: providerResult.providerName,
        amount,
        newBalance: refundResult.newBalance,
        message: `VTU Purchase failed on all provider gateways. Your wallet was automatically refunded ₦${amount.toFixed(2)}.`,
        isRefunded: true,
      };
    }

    // ------------------------------------------------------------------
    // STEP 6: If Provider Returns PENDING -> Enqueue Background Reconciliation Worker
    // ------------------------------------------------------------------
    if (providerResult.status === 'PENDING') {
      console.log(`⏳ [VTU Dispatcher] Step 6: Order status is PENDING (${providerResult.providerReference}). Enqueuing background status reconciliation job...`);

      VtuReconciliationQueue.enqueuePendingCheck({
        transactionId: transaction.id,
        userId,
        reference,
        providerReference: providerResult.providerReference || `PROV_${Date.now()}`,
        amount,
        provider: providerResult.providerName === ProviderEnum.INLOMAX ? this.primaryProvider : this.fallbackProvider,
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          providerUsed: providerResult.providerName,
          providerReference: providerResult.providerReference,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        status: 'PENDING',
        reference,
        providerUsed: providerResult.providerName,
        providerReference: providerResult.providerReference,
        amount,
        newBalance: debitResult.newBalance,
        message: 'VTU purchase order submitted and is currently being processed by network operators.',
      };
    }

    // ------------------------------------------------------------------
    // SUCCESS PATH
    // ------------------------------------------------------------------
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        providerUsed: providerResult.providerName,
        providerReference: providerResult.providerReference,
      },
    });

    console.log(`🎉 [VTU Purchase SUCCESS] Provider: ${providerResult.providerName} | Ref: ${providerResult.providerReference} | New Balance: ₦${debitResult.newBalance.toFixed(2)}`);

    return {
      success: true,
      status: 'SUCCESS',
      reference,
      providerUsed: providerResult.providerName,
      providerReference: providerResult.providerReference,
      amount,
      newBalance: debitResult.newBalance,
      message: `VTU ${serviceType} purchase completed successfully via ${providerResult.providerName}.`,
    };
  }
}
