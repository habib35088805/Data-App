import dotenv from 'dotenv';
dotenv.config();

export const vtuConfig = {
  inlomax: {
    apiKey: process.env.INLOMAX_API_KEY || 'inlomax_test_api_key_123',
    baseUrl: process.env.INLOMAX_BASE_URL || 'https://inlomax.com/api/v1',
    timeoutMs: Number(process.env.INLOMAX_TIMEOUT_MS) || 8000,
  },
  husmodata: {
    apiKey: process.env.HUSMODATA_API_KEY || 'husmodata_test_api_key_456',
    baseUrl: process.env.HUSMODATA_BASE_URL || 'https://husmodata.com/api',
    timeoutMs: Number(process.env.HUSMODATA_TIMEOUT_MS) || 8000,
  },
  // Network ID mapping standard for Nigerian Providers (MTN, AIRTEL, GLO, NINE_MOBILE)
  networkMap: {
    MTN: { inlomaxId: '1', husmodataId: 1 },
    AIRTEL: { inlomaxId: '2', husmodataId: 2 },
    GLO: { inlomaxId: '3', husmodataId: 3 },
    NINE_MOBILE: { inlomaxId: '4', husmodataId: 4 },
  },
};
