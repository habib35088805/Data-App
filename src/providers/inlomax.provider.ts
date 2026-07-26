import { NetworkEnum, ProviderEnum } from '@prisma/client';
import { IVtuProvider, VtuProviderResult } from './vtuProvider.interface';
import { vtuConfig } from '../config/vtu.config';

export class InlomaxProvider implements IVtuProvider {
  public readonly name = ProviderEnum.INLOMAX;

  public async purchaseData(network: NetworkEnum, phone: string, planId: string): Promise<VtuProviderResult> {
    console.log(`[InlomaxProvider] Initiating Data Purchase for ${network} | Phone: ${phone} | Plan: ${planId}...`);
    const networkId = vtuConfig.networkMap[network]?.inlomaxId || '1';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), vtuConfig.inlomax.timeoutMs);

      const response = await fetch(`${vtuConfig.inlomax.baseUrl}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vtuConfig.inlomax.apiKey}`,
        },
        body: JSON.stringify({
          network: networkId,
          mobile_number: phone,
          plan: planId,
          Ported_number: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Inlomax HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return this.parseResponse(data);
    } catch (error: any) {
      console.warn(`[InlomaxProvider] Data purchase error/timeout: ${error.message}`);
      return {
        providerName: this.name,
        status: 'FAILED',
        responseMessage: `Inlomax Error: ${error.message}`,
      };
    }
  }

  public async purchaseAirtime(network: NetworkEnum, phone: string, amount: number): Promise<VtuProviderResult> {
    console.log(`[InlomaxProvider] Initiating Airtime Purchase for ${network} | Phone: ${phone} | Amount: ₦${amount}...`);
    const networkId = vtuConfig.networkMap[network]?.inlomaxId || '1';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), vtuConfig.inlomax.timeoutMs);

      const response = await fetch(`${vtuConfig.inlomax.baseUrl}/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vtuConfig.inlomax.apiKey}`,
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
        throw new Error(`Inlomax HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return this.parseResponse(data);
    } catch (error: any) {
      console.warn(`[InlomaxProvider] Airtime purchase error/timeout: ${error.message}`);
      return {
        providerName: this.name,
        status: 'FAILED',
        responseMessage: `Inlomax Error: ${error.message}`,
      };
    }
  }

  public async checkBalance(): Promise<number> {
    try {
      const response = await fetch(`${vtuConfig.inlomax.baseUrl}/balance`, {
        headers: { 'Authorization': `Bearer ${vtuConfig.inlomax.apiKey}` },
      });
      if (!response.ok) return 0;
      const data = (await response.json()) as any;
      return Number(data.balance || data.user?.balance || 0);
    } catch {
      return 0;
    }
  }

  public async queryStatus(providerReference: string): Promise<VtuProviderResult> {
    try {
      const response = await fetch(`${vtuConfig.inlomax.baseUrl}/status/${providerReference}`, {
        headers: { 'Authorization': `Bearer ${vtuConfig.inlomax.apiKey}` },
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
    const rawStatus = (data.status || data.Status || '').toString().toLowerCase();
    let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'FAILED';

    if (rawStatus === 'success' || rawStatus === 'successful' || data.code === 200) {
      status = 'SUCCESS';
    } else if (rawStatus === 'pending' || rawStatus === 'processing') {
      status = 'PENDING';
    }

    return {
      providerName: this.name,
      status,
      providerReference: data.id || data.reference || data.order_id || `INL_${Date.now()}`,
      responseMessage: data.message || data.api_response || 'Inlomax order processed',
      rawResponse: data,
    };
  }
}
