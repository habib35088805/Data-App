export type NetworkType = 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE';

const PREFIX_MAP: Record<NetworkType, string[]> = {
  MTN: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916', '0704'],
  AIRTEL: ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'],
  GLO: ['0805', '0807', '0705', '0815', '0811', '0905', '0915'],
  NINE_MOBILE: ['0809', '0817', '0818', '0909', '0908'],
};

/**
 * Auto-detects Nigerian Telco Network operator based on phone number prefix.
 * e.g., '08031234567' -> 'MTN', '08021234567' -> 'AIRTEL'
 */
export function detectNetworkFromPrefix(phone: string): NetworkType | null {
  const cleaned = phone.replace(/\D/g, '');
  
  let formatted = cleaned;
  if (cleaned.startsWith('234')) {
    formatted = '0' + cleaned.slice(3);
  }

  if (formatted.length < 4) return null;

  const prefix = formatted.slice(0, 4);

  for (const [network, prefixes] of Object.entries(PREFIX_MAP)) {
    if (prefixes.includes(prefix)) {
      return network as NetworkType;
    }
  }

  return null;
}
