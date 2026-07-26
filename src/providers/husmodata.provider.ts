import { NetworkEnum, ProviderEnum } from '@prisma/client';
import { IVtuProvider, VtuProviderResult } from './vtuProvider.interface';
import { vtuConfig } from '../config/vtu.config';

export class HusmodataProvider implements IVtuProvider {
  public readonly name = ProviderEnum.HUSMODATA;

  public async purchaseData(network: NetworkEnum, phone: string, planId: string): Promise<VtuProviderResult> {
    console.log(`[HusmodataProvider Fallback] Initiating Data Purchase for ${network} | Phone: ${phone} | Plan: ${planId}...`);
    const networkId = vtuConfig.networkMap[network]?.husmodataId || 1;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), vtuConfig.husmodata.timeoutMs);

      const response = await fetch(`${vtuConfig.husmodata.baseUrl}/data/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${vtuConfig.husmodata.apiKey}`,
        },
        body: JSON.stringify({
          network: networkId,
          mobile_number: phone,
          plan: Number(planId) || planId,
          Ported_number: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Husmodata HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return this.parseResponse(data);
    } catch (error: any) {
      console.warn(`[HusmodataProvider] Data purchase error/timeout: ${error.message}`);
      return {
        providerName: this.name,
        status: 'FAILED',
        responseMessage: `Husmodata Error: ${error.message}`,
      };
    }
  }

  public async purchaseAirtime(network: NetworkEnum, phone: string, amount: number): Promise<VtuProviderResult> {
    console.log(`[HusmodataProvider Fallback] Initiating Airtime Purchase for ${network} | Phone: ${phone} | Amount: ₦${amount}...`);
    const networkId = vtuConfig.networkMap[network]?.husmodataId || 1;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), vtuConfig.husmodata.timeoutMs);

      const response = await fetch(`${vtuConfig.husmodata.baseUrl}/topup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${vtuConfig.husmodata.apiKey}`,
        },
        body: JSON.stringify({
          network: networkId,
          amount,
          mobile_number: phone,
          airtime_type: 'VTU',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Husmodata HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return this.parseResponse(data);
    } catch (error: any) {
      console.warn(`[HusmodataProvider] Airtime purchase error/timeout: ${error.message}`);
      return {
        providerName: this.name,
        status: 'FAILED',
        responseMessage: `Husmodata Error: ${error.message}`,
      };
    }
  }

  public async checkBalance(): Promise<number> {
    try {
      const response = await fetch(`${vtuConfig.husmodata.baseUrl}/user/`, {
        headers: { 'Authorization': `Token ${vtuConfig.husmodata.apiKey}` },
      });
      if (!response.ok) return 0;
      const data = (await response.json()) as any;
      return Number(data.user?.wallet_balance || data.wallet_balance || 0);
    } catch {
      return 0;
    }
  }

  public async queryStatus(providerReference: string): Promise<VtuProviderResult> {
    try {
      const response = await fetch(`${vtuConfig.husmodata.baseUrl}/data/${providerReference}`, {
        headers: { 'Authorization': `Token ${vtuConfig.husmodata.apiKey}` },
      });
      if (!response.ok) {
        return { providerName: this.name, status: 'FAILED', responseMessage: 'Status query failed' };
      }
      const data = (await response.json()) as any;
      return this.parseResponse(data);
    } catch (error: any) {
      return { providerName: this.name, status: 'FAILED', responseMessage: error.message };
    }
  }

  private parseResponse(data: any): VtuProviderResult {
    const rawStatus = (data.Status || data.status || '').toString().toLowerCase();
    let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'FAILED';

    if (rawStatus === 'successful' || rawStatus === 'success' || data.code === 200) {
      status = 'SUCCESS';
    } else if (rawStatus === 'pending' || rawStatus === 'processing') {
      status = 'PENDING';
    }

    return {
      providerName: this.name,
      status,
      providerReference: data.id || data.reference || `HUS_${Date.now()}`,
      responseMessage: data.api_response || data.message || 'Husmodata order processed',
      rawResponse: data,
    };
  }
}
