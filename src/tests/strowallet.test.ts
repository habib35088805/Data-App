import crypto from 'crypto';
import { strowalletConfig } from '../config/strowallet.config';
import { StrowalletWebhookSecurity, CustomRequest } from '../middleware/strowalletSecurity.middleware';
import { StrowalletService } from '../services/strowallet.service';

async function runStrowalletUnitTests() {
  console.log('--- 🛡 Strowallet Module Unit & Security Tests ---\n');

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

  // 1. Test HMAC SHA-512 Signature Verification
  console.log('\n[Test 1] Cryptographic Signature Verification (HMAC SHA-512):');

  const testPayload = JSON.stringify({
    event: 'virtual_account.credited',
    data: {
      reference: 'TEST_REF_999888',
      sessionId: 'SESS_1234567890',
      accountNumber: '8012345678',
      amount: 5000.0,
    },
  });

  const validSignature = crypto
    .createHmac('sha512', strowalletConfig.webhookSecret)
    .update(testPayload)
    .digest('hex');

  // Mock Request & Response objects
  const state = { nextCalled: false };
  const mockReq: CustomRequest = {
    headers: { 'x-strowallet-signature': validSignature },
    rawBody: testPayload,
    body: JSON.parse(testPayload),
    ip: '18.133.21.144',
  } as any;

  let responseStatus: number = 0;
  let responseJson: any = null;

  const mockRes: any = {
    status: (code: number) => {
      responseStatus = code;
      return {
        json: (data: any) => {
          responseJson = data;
        },
      };
    },
  };

  const mockNext = () => {
    state.nextCalled = true;
  };

  StrowalletWebhookSecurity.verifyWebhookSecurity(mockReq, mockRes, mockNext);
  assert(state.nextCalled, 'Valid HMAC SHA-512 signature correctly passed verification middleware');

  // 2. Test Invalid Signature Rejection
  console.log('\n[Test 2] Tampered Payload / Invalid Signature Security Rejection:');
  state.nextCalled = false;
  responseStatus = 0;

  const invalidReq: CustomRequest = {
    headers: { 'x-strowallet-signature': 'invalid_forged_signature_hash_xyz' },
    rawBody: testPayload,
    body: JSON.parse(testPayload),
    ip: '18.133.21.144',
  } as any;

  StrowalletWebhookSecurity.verifyWebhookSecurity(invalidReq, mockRes, mockNext);
  assert(!state.nextCalled, 'Invalid signature correctly prevented request from reaching controller');
  assert(responseStatus === 401, 'Invalid signature returned HTTP 401 Unauthorized');
  assert(responseJson?.error === 'INVALID_SIGNATURE', 'Returned structured INVALID_SIGNATURE error payload');

  // 3. Test Missing Signature Header Rejection
  console.log('\n[Test 3] Missing Signature Security Rejection:');
  state.nextCalled = false;
  responseStatus = 0;

  const missingSigReq: CustomRequest = {
    headers: {},
    rawBody: testPayload,
    body: JSON.parse(testPayload),
    ip: '18.133.21.144',
  } as any;

  StrowalletWebhookSecurity.verifyWebhookSecurity(missingSigReq, mockRes, mockNext);
  assert(!state.nextCalled, 'Missing signature prevented request execution');
  assert(responseStatus === 401, 'Missing signature returned HTTP 401 Unauthorized');

  // 4. Test Virtual Account Onboarding Service
  console.log('\n[Test 4] Virtual Bank Account Generation Onboarding Service:');
  try {
    const virtualAccount = await StrowalletService.createVirtualAccount({
      id: 'test_user_unit_999',
      fullName: 'Amina Bello',
      email: 'amina.bello@example.com',
      phone: '08099887766',
    });

    assert(typeof virtualAccount.virtualAccountNumber === 'string', 'Virtual Account Number generated');
    assert(virtualAccount.virtualAccountNumber.length >= 10, 'Virtual Account Number has valid length');
    assert(virtualAccount.virtualBankName.includes('Wema'), 'Virtual Bank assigned successfully');
  } catch (err: any) {
    assert(false, `Virtual Account Generation failed: ${err.message}`);
  }

  console.log(`\n-------------------------------------------------`);
  console.log(`📊 Test Summary: ${passedTests} Passed | ${failedTests} Failed`);
  console.log(`-------------------------------------------------\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Run test suite if invoked directly
runStrowalletUnitTests().catch((err) => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
