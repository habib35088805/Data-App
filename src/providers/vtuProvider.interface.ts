import { NetworkEnum, ProviderEnum } from '@prisma/client';

export type VtuProviderStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface VtuProviderResult {
  providerName: ProviderEnum;
  status: VtuProviderStatus;
  providerReference?: string;
  responseMessage: string;
  rawResponse?: any;
}

export interface IVtuProvider {
  readonly name: ProviderEnum;
  
  purchaseData(network: NetworkEnum, phone: string, planId: string): Promise<VtuProviderResult>;
  
  purchaseAirtime(network: NetworkEnum, phone: string, amount: number): Promise<VtuProviderResult>;
  
  checkBalance(): Promise<number>;
  
  queryStatus(providerReference: string): Promise<VtuProviderResult>;
}
