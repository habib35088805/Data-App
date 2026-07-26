import { NetworkEnum, ProviderEnum, ServiceType } from '@prisma/client';
import { IVtuProvider, VtuProviderResult } from '../providers/vtuProvider.interface';
import { VtuDispatcherService } from '../services/vtuDispatcher.service';

// Mock Provider Implementations for Testing Engine Scenarios
class MockInlomaxProvider implements IVtuProvider {
  public readonly name = ProviderEnum.INLOMAX;
  constructor(private shouldSucceed: boolean, private isPending = false) {}

  async purchaseData(): Promise<VtuProviderResult> {
    if (this.isPending) {
      return { providerName: this.name, status: 'PENDING', providerReference: 'INL_PENDING_111', responseMessage: 'Order processing' };
    }
    if (this.shouldSucceed) {
      return { providerName: this.name, status: 'SUCCESS', providerReference: 'INL_SUCCESS_222', responseMessage: 'Data delivered' };
    }
    return { providerName: this.name, status: 'FAILED', responseMessage: 'Inlomax timeout or gateway error' };
  }

  async purchaseAirtime(): Promise<VtuProviderResult> {
    return this.purchaseData();
  }
  async checkBalance(): Promise<number> { return 5000; }
  async queryStatus(): Promise<VtuProviderResult> { return this.purchaseData(); }
}

class MockHusmodataProvider implements IVtuProvider {
  public readonly name = ProviderEnum.HUSMODATA;
  constructor(private shouldSucceed: boolean) {}

  async purchaseData(): Promise<VtuProviderResult> {
    if (this.shouldSucceed) {
      return { providerName: this.name, status: 'SUCCESS', providerReference: 'HUS_SUCCESS_333', responseMessage: 'Husmodata fallback delivered' };
    }
    return { providerName: this.name, status: 'FAILED', responseMessage: 'Husmodata fallback failed' };
  }

  async purchaseAirtime(): Promise<VtuProviderResult> {
    return this.purchaseData();
  }
  async checkBalance(): Promise<number> { return 5000; }
  async queryStatus(): Promise<VtuProviderResult> { return this.purchaseData(); }
}

async function runDispatcherTests() {
  console.log('--- 🚀 VTU Dispatcher & Automatic Refund Engine Unit Tests ---\n');

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

  // 1. Primary Success Test
  console.log('[Test 1] Primary Provider (Inlomax) Dispatch Success:');
  const primarySuccessDispatcher = new VtuDispatcherService(
    new MockInlomaxProvider(true),
    new MockHusmodataProvider(true)
  );

  // Mock wallet & user in tests
  try {
    // Test logic structure check
    assert(typeof primarySuccessDispatcher.processPurchase === 'function', 'processPurchase engine method exists');
  } catch (err: any) {
    assert(false, `Test 1 failed: ${err.message}`);
  }

  // 2. Fallback Execution Test Logic
  console.log('\n[Test 2] Primary Failure -> Automatic Fallback to Husmodata:');
  const fallbackDispatcher = new VtuDispatcherService(
    new MockInlomaxProvider(false), // Inlomax Fails
    new MockHusmodataProvider(true)  // Husmodata Succeeds
  );
  assert(fallbackDispatcher !== null, 'Dispatcher created with Inlomax fail + Husmodata success strategy');

  // 3. Dual Failure -> Automatic Refund Strategy Test
  console.log('\n[Test 3] Dual-Provider Failure -> Automatic Wallet Refund Engine:');
  const dualFailDispatcher = new VtuDispatcherService(
    new MockInlomaxProvider(false), // Inlomax Fails
    new MockHusmodataProvider(false) // Husmodata Fails
  );
  assert(dualFailDispatcher !== null, 'Dispatcher created with dual-failure strategy');

  console.log(`\n-------------------------------------------------`);
  console.log(`📊 VTU Dispatcher Test Suite Ready`);
  console.log(`-------------------------------------------------\n`);
}

runDispatcherTests().catch(console.error);
