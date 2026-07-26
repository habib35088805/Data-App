import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { WalletService } from '../services/wallet.service';
import { DuplicateReferenceError } from '../errors/wallet.errors';

export class StrowalletWebhookController {
  /**
   * Listener for Strowallet Virtual Account Credit Notifications.
   * Route: POST /api/v1/webhooks/strowallet
   */
  public static async handleWebhook(req: Request, res: Response): Promise<Response> {
    try {
      const payload = req.body;
      console.log('[Strowallet Webhook Received Payload]:', JSON.stringify(payload, null, 2));

      const data = payload.data || payload;

      const eventType = payload.event || data.event || 'virtual_account.credited';
      const reference = data.reference || data.tx_ref || data.transactionRef;
      const sessionId = data.sessionId || data.session_id;
      const accountNumber = data.accountNumber || data.account_number;
      const amountCredited = Number(data.amount || data.settledAmount || data.credit_amount);

      if (!accountNumber || !amountCredited || amountCredited <= 0) {
        console.warn('[Strowallet Webhook] Invalid payload structure. Missing accountNumber or valid amount.');
        return res.status(400).json({
          success: false,
          error: 'INVALID_PAYLOAD',
          message: 'Webhook payload missing required accountNumber or valid amount.',
        });
      }

      // 1. Form Unique Idempotency Reference (Session ID or Transaction Reference)
      const uniqueReference = sessionId
        ? `STR_SESS_${sessionId}`
        : reference
        ? `STR_REF_${reference}`
        : `STR_AUTO_${accountNumber}_${Date.now()}`;

      // 2. Check strict idempotency against existing Ledger Entries
      const existingLedger = await prisma.ledgerEntry.findUnique({
        where: { reference: uniqueReference },
      });

      if (existingLedger) {
        console.log(`[Strowallet Webhook] Idempotent trigger: Transaction reference '${uniqueReference}' already credited.`);
        return res.status(200).json({
          success: true,
          message: 'Webhook notification already processed (Idempotent success).',
          data: { reference: uniqueReference, status: 'ALREADY_PROCESSED' },
        });
      }

      // 3. Locate Target User Wallet by Virtual Account Number
      const wallet = await prisma.wallet.findFirst({
        where: { virtualAccountNumber: accountNumber },
        include: { user: true },
      });

      if (!wallet) {
        console.error(`[Strowallet Webhook] No registered user wallet found for Virtual Account Number: ${accountNumber}`);
        return res.status(404).json({
          success: false,
          error: 'WALLET_NOT_FOUND',
          message: `No wallet associated with virtual account number '${accountNumber}'.`,
        });
      }

      // 4. Atomically Credit User Wallet using FOR UPDATE Row-Level Locked Transaction
      const creditResult = await WalletService.credit({
        userId: wallet.userId,
        amount: amountCredited,
        reference: uniqueReference,
        description: `Automated Wallet Deposit via Strowallet (${wallet.virtualBankName || 'Virtual Bank'} - ${accountNumber})`,
      });

      console.log(
        `⚡ [Strowallet Funding SUCCESS] User ID: ${wallet.userId} | Credited: ₦${amountCredited.toFixed(2)} | New Balance: ₦${creditResult.newBalance.toFixed(2)}`
      );

      // 5. Return HTTP 200 OK immediately
      return res.status(200).json({
        success: true,
        message: 'Wallet funded successfully via Strowallet webhook.',
        data: {
          userId: wallet.userId,
          virtualAccountNumber: accountNumber,
          amountCredited,
          newBalance: creditResult.newBalance,
          reference: uniqueReference,
          ledgerEntryId: creditResult.ledgerEntryId,
        },
      });
    } catch (error: any) {
      if (error instanceof DuplicateReferenceError) {
        return res.status(200).json({
          success: true,
          message: 'Webhook notification already processed (Idempotent duplicate caught).',
        });
      }

      console.error('[Strowallet Webhook Critical Processing Error]:', error);
      return res.status(500).json({
        success: false,
        error: 'WEBHOOK_PROCESSING_FAILED',
        message: 'Internal server error processing Strowallet webhook.',
      });
    }
  }
}
