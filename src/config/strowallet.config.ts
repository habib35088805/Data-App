import dotenv from 'dotenv';
dotenv.config();

export const strowalletConfig = {
  apiKey: process.env.STROWALLET_API_KEY || 'str_pub_test_api_key_sample',
  secretKey: process.env.STROWALLET_SECRET_KEY || 'str_sec_test_secret_key_sample',
  baseUrl: process.env.STROWALLET_BASE_URL || 'https://api.strowallet.com/api/v1',
  webhookSecret: process.env.STROWALLET_WEBHOOK_SECRET || 'strowallet_wh_secret_sample_key_12345',
  // Official Strowallet Webhook Egress IPs for IP Whitelisting verification
  allowedIps: (process.env.STROWALLET_ALLOWED_IPS || '18.133.21.144,35.178.194.238,127.0.0.1')
    .split(',')
    .map((ip) => ip.trim()),
};
