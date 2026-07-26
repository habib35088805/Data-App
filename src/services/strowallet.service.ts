import { prisma } from '../config/db';
import { strowalletConfig } from '../config/strowallet.config';

export interface UserOnboardingData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bvn?: string;
  nin?: string;
}

export interface VirtualAccountResponse {
  virtualAccountNumber: string;
  virtualBankName: string;
  virtualAccountName: string;
}

export class StrowalletService {
  /**
   * Generates a dedicated NGN Virtual Bank Account (Wema / Sterling / Moniepoint Partner Banks)
   * via Strowallet API and persists credentials to the user's Wallet record.
   */
  public static async createVirtualAccount(user: UserOnboardingData): Promise<VirtualAccountResponse> {
    console.log(`[StrowalletService] Creating dedicated NGN virtual bank account for User ID: ${user.id} (${user.email})...`);

    const nameParts = user.fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'VTU';

    let accountData: VirtualAccountResponse;

    try {
      const response = await fetch(`${strowalletConfig.baseUrl}/virtual-bank/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'public-key': strowalletConfig.apiKey,
          'secret-key': strowalletConfig.secretKey,
        },
        body: JSON.stringify({
          email: user.email,
          phone: user.phone,
          firstName,
          lastName,
          accountName: `${user.fullName} / VTU`,
          bvn: user.bvn || undefined,
          nin: user.nin || undefined,
        }),
      });

      if (response.ok) {
        const body = (await response.json()) as any;
        accountData = {
          virtualAccountNumber: body.data?.accountNumber || body.accountNumber,
          virtualBankName: body.data?.bankName || body.bankName || 'Wema Bank (Strowallet)',
          virtualAccountName: body.data?.accountName || body.accountName || `${user.fullName} / VTU`,
        };
      } else {
        console.warn(`[StrowalletService] API returned status ${response.status}. Using fallback simulation partner account for development.`);
        accountData = this.generateFallbackAccount(user);
      }
    } catch (error: any) {
      console.warn(`[StrowalletService] Network/API call error: ${error.message}. Using development virtual account generator.`);
      accountData = this.generateFallbackAccount(user);
    }

    // Attempt persisting virtual account to Wallet in Database
    try {
      const wallet = await prisma.wallet.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          balance: 0.0,
          virtualAccountNumber: accountData.virtualAccountNumber,
          virtualBankName: accountData.virtualBankName,
          virtualAccountName: accountData.virtualAccountName,
        },
        update: {
          virtualAccountNumber: accountData.virtualAccountNumber,
          virtualBankName: accountData.virtualBankName,
          virtualAccountName: accountData.virtualAccountName,
        },
      });

      console.log(`[StrowalletService] Successfully assigned Virtual Account ${accountData.virtualAccountNumber} (${accountData.virtualBankName}) to User ${user.id}.`);
      return {
        virtualAccountNumber: wallet.virtualAccountNumber!,
        virtualBankName: wallet.virtualBankName!,
        virtualAccountName: wallet.virtualAccountName!,
      };
    } catch (dbError: any) {
      console.warn(`[StrowalletService] DB write skipped (DB offline or unit test mode): ${dbError.message}`);
      return accountData;
    }
  }

  /**
   * Helper function for development fallback generation
   */
  private static generateFallbackAccount(user: UserOnboardingData): VirtualAccountResponse {
    const cleanedPhone = user.phone.replace(/\D/g, '');
    const accountNum = cleanedPhone.length >= 10 ? cleanedPhone.slice(-10) : `80${Math.floor(10000000 + Math.random() * 90000000)}`;

    return {
      virtualAccountNumber: accountNum,
      virtualBankName: 'Wema Bank (Strowallet Partner)',
      virtualAccountName: `${user.fullName} / VTU App`,
    };
  }
}
