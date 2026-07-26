import { WalletService } from './services/wallet.service';
import { InsufficientBalanceError, DuplicateReferenceError } from './errors/wallet.errors';

async function runDemo() {
  console.log('--- 🚀 VTU Wallet Service Verification Demo ---\n');

  const testUserId = 'user_vtu_demo_123';

  console.log('[Step 1] Funding wallet with ₦10,000.00...');
  try {
    const credit1 = await WalletService.credit({
      userId: testUserId,
      amount: 10000.00,
      reference: `CREDIT_FUND_${Date.now()}`,
      description: 'Initial funding via Strowallet Virtual Account',
    });
    console.log(`✅ Success! New Balance: ₦${credit1.newBalance.toFixed(2)} (Ledger Ref: ${credit1.reference})`);
  } catch (err: any) {
    console.log(`ℹ Note: ${err.message}`);
  }

  console.log('\n[Step 2] Purchasing Airtime ₦2,500.00...');
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

  console.log('\n--- 🎉 VTU Wallet Service Verification Complete ---');
}
