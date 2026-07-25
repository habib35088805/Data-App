/**
 * Demo Simulation Script for Nigerian VTU Platform Wallet Service
 * Demonstrating double-entry ledger integrity, FOR UPDATE row locking,
 * and structured error handling.
 */

import { WalletService } from './services/wallet.service.js';
import { InsufficientBalanceError, DuplicateReferenceError } from './errors/wallet.errors.js';

async function runDemo() {
  console.log('--- 🚀 VTU Wallet Service Verification Demo ---\n');

  const testUserId = 'user_vtu_demo_123';

  // 1. Funding Wallet (Credit)
  console.log('[Step 1] Funding wallet with ₦10,000.00...');
  try {
    const credit1 = await WalletService.credit({
      userId: testUserId,
      amount: 10000.00,
      reference: `CREDIT_FUND_${Date.now()}`,
      description: 'Initial funding via Paystack Virtual Account',
    });
    console.log(`✅ Success! New Balance: ₦${credit1.newBalance.toFixed(2)} (Ledger Ref: ${credit1.reference})`);
  } catch (err: any) {
    console.log(`ℹ Note: ${err.message}`);
  }

  // 2. Purchasing Airtime (Debit)
  console.log('\n[Step 2] Purchasing MTN Airtime ₦2,500.00...');
  try {
    const debit1 = await WalletService.debit({
      userId: testUserId,
      amount: 2500.00,
      reference: `VTU_AIRTIME_MTN_${Date.now()}`,
      description: 'MTN VTU Airtime purchase for 08030000000',
    });
    console.log(`✅ Success! New Balance: ₦${debit1.newBalance.toFixed(2)} (Previous: ₦${debit1.previousBalance.toFixed(2)})`);
  } catch (err: any) {
    console.error(`❌ Debit failed: ${err.message}`);
  }

  // 3. Simulating Idempotency Check (Duplicate Reference)
  console.log('\n[Step 3] Attempting duplicate transaction with identical reference...');
  const duplicateRef = `RETRY_REF_${Date.now()}`;
  try {
    await WalletService.debit({
      userId: testUserId,
      amount: 1000.00,
      reference: duplicateRef,
      description: 'First attempt',
    });
    console.log('First attempt succeeded.');

    // Duplicate call
    await WalletService.debit({
      userId: testUserId,
      amount: 1000.00,
      reference: duplicateRef,
      description: 'Retried attempt',
    });
  } catch (err: any) {
    if (err instanceof DuplicateReferenceError) {
      console.log(`🛡 Idempotency Guard Triggered: ${err.message}`);
    } else {
      console.error(`Unexpected error: ${err.message}`);
    }
  }

  // 4. Simulating Overdraft (Insufficient Balance)
  console.log('\n[Step 4] Attempting overdraft debit of ₦50,000.00...');
  try {
    await WalletService.debit({
      userId: testUserId,
      amount: 50000.00,
      reference: `VTU_DATA_LARGE_${Date.now()}`,
      description: 'Attempting invalid large purchase',
    });
  } catch (err: any) {
    if (err instanceof InsufficientBalanceError) {
      console.log(`🛡 Balance Security Guard Triggered:`);
      console.log(`   - Status Code: ${err.statusCode}`);
      console.log(`   - Error Code: ${err.errorCode}`);
      console.log(`   - Available Balance: ₦${err.availableBalance.toFixed(2)}`);
      console.log(`   - Requested Amount: ₦${err.requestedAmount.toFixed(2)}`);
    } else {
      console.error(`Unexpected error: ${err.message}`);
    }
  }

  console.log('\n--- 🎉 VTU Wallet Service Verification Complete ---');
}

// Uncomment to run directly if DB is connected:
// runDemo().catch(console.error);
