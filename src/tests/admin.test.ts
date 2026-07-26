import { AdminService } from '../services/admin.service';

async function runAdminUnitTests() {
  console.log('--- 🛡 Admin Management Engine Unit Tests ---\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failedTests++;
    }
  }

  // 1. Fallback Mode Switcher Test
  console.log('[Test 1] Dynamic Provider Mode Switcher:');
  const modeResult = AdminService.setProviderMode('INLOMAX_PRIMARY');
  assert(modeResult.activeProviderMode === 'INLOMAX_PRIMARY', 'Provider mode updated to INLOMAX_PRIMARY');

  const modeResult2 = AdminService.setProviderMode('AUTOMATIC_FAILOVER');
  assert(modeResult2.activeProviderMode === 'AUTOMATIC_FAILOVER', 'Provider mode reverted to AUTOMATIC_FAILOVER');

  // 2. Data Plan Pricing Markup Test
  console.log('\n[Test 2] Data Plan Pricing Markup Calculation:');
  const updatedPlan = AdminService.updatePlanPricing('mtn_1gb', 350, 240);
  assert(updatedPlan.sellingPrice === 350, 'Selling price updated to ₦350');
  assert(updatedPlan.profitMargin === 110, 'Profit margin correctly calculated to +₦110');

  // 3. Compulsory Admin Reason Validation Test
  console.log('\n[Test 3] Compulsory Admin Audit Reason Log Enforcement:');
  try {
    await AdminService.forceRefundTransaction('tx_mock_123', '');
    assert(false, 'Should reject force refund with empty admin reason');
  } catch (err: any) {
    assert(err.message.includes('ADMIN_REASON_REQUIRED'), 'Empty admin reason correctly rejected with ADMIN_REASON_REQUIRED error');
  }

  try {
    await AdminService.toggleUserStatus('usr_mock_123', 'SUSPENDED' as any, 'short');
    assert(false, 'Should reject short admin reason (< 5 chars)');
  } catch (err: any) {
    assert(err.message.includes('ADMIN_REASON_REQUIRED'), 'Short admin reason correctly rejected');
  }

  console.log(`\n-------------------------------------------------`);
  console.log(`📊 Admin Engine Unit Test Summary: ${passedTests} Passed | ${failedTests} Failed`);
  console.log(`-------------------------------------------------\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdminUnitTests().catch((err) => {
  console.error('Admin Test Exception:', err);
  process.exit(1);
});
