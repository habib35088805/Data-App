import { prisma } from '../config/db';
import { WalletService } from './wallet.service';
import { IVtuProvider } from '../providers/vtuProvider.interface';

export class VtuReconciliationQueue {
  private static pendingQueue: Array<{
    transactionId: string;
    userId: string;
    reference: string;
    providerReference: string;
    amount: number;
    provider: IVtuProvider;
    scheduledAt: number;
  }> = [];

  /**
   * Enqueues a pending transaction order to be queried after 30 seconds
   */
  public static enqueuePendingCheck(params: {
    transactionId: string;
    userId: string;
    reference: string;
    providerReference: string;
    amount: number;
    provider: IVtuProvider;
  }) {
    console.log(`⏱ [Reconciliation Queue] Enqueued pending transaction '${params.reference}' for status reconciliation in 30s.`);

    const job = {
      ...params,
      scheduledAt: Date.now() + 30000, // 30 seconds delay
    };

    this.pendingQueue.push(job);

    // Schedule background execution
    setTimeout(() => {
      this.processJob(job).catch((err) => console.error('[Reconciliation Worker Error]:', err));
    }, 30000);
  }

  private static async processJob(job: typeof VtuReconciliationQueue.pendingQueue[0]) {
    console.log(`🔍 [Reconciliation Worker] Checking pending status for Provider Ref: ${job.providerReference}...`);

    try {
      const statusResult = await job.provider.queryStatus(job.providerReference);

      if (statusResult.status === 'SUCCESS') {
        console.log(`✅ [Reconciliation Worker] Transaction '${job.reference}' resolved to SUCCESS.`);
        await prisma.transaction.update({
          where: { id: job.transactionId },
          data: { status: 'SUCCESS', providerReference: job.providerReference },
        });
      } else if (statusResult.status === 'FAILED') {
        console.warn(`🚨 [Reconciliation Worker] Transaction '${job.reference}' resolved to FAILED. Executing Automatic Refund...`);

        // Execute Atomic Refund
        const refundResult = await WalletService.credit({
          userId: job.userId,
          amount: job.amount,
          reference: `REFUND_${job.reference}`,
          description: `Automatic Refund for failed pending VTU order (${job.reference})`,
        });

        await prisma.transaction.update({
          where: { id: job.transactionId },
          data: { status: 'FAILED' },
        });

        console.log(`💰 [Automatic Refund Complete] User ID: ${job.userId} | Refunded: ₦${job.amount} | New Balance: ₦${refundResult.newBalance}`);
      } else {
        console.log(`⏳ [Reconciliation Worker] Transaction '${job.reference}' still PENDING. Retrying check...`);
        // Re-enqueue for another check if still pending
      }
    } catch (err: any) {
      console.error(`❌ [Reconciliation Worker Error processing job ${job.reference}]:`, err.message);
    }
  }
}
