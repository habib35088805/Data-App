import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { strowalletConfig } from '../config/strowallet.config';

export interface CustomRequest extends Request {
  rawBody?: string | Buffer;
}

export class StrowalletWebhookSecurity {
  /**
   * Verifies incoming Webhook request HMAC signature and IP Whitelist.
   * Employs timing-safe cryptographic comparisons to mitigate side-channel timing attacks.
   */
  public static verifyWebhookSecurity(req: CustomRequest, res: Response, next: NextFunction) {
    // 1. IP Whitelist Check
    const clientIp = StrowalletWebhookSecurity.getClientIp(req);

    if (process.env.NODE_ENV === 'production') {
      const isAllowedIp = strowalletConfig.allowedIps.some((allowedIp) => {
        return clientIp === allowedIp || clientIp.endsWith(`:${allowedIp}`) || allowedIp === '*';
      });

      if (!isAllowedIp) {
        console.warn(`[Security Alert] Rejected Strowallet Webhook from unwhitelisted IP: ${clientIp}`);
        return res.status(403).json({
          success: false,
          error: 'IP_NOT_AUTHORIZED',
          message: `Access denied. Sender IP (${clientIp}) is not authorized.`,
        });
      }
    }

    // 2. Cryptographic Signature Verification
    const signatureHeader =
      (req.headers['x-strowallet-signature'] as string) ||
      (req.headers['x-strowallet-hash'] as string) ||
      (req.headers['x-signature'] as string);

    if (!signatureHeader) {
      console.warn(`[Security Alert] Missing Strowallet signature header from IP ${clientIp}`);
      return res.status(401).json({
        success: false,
        error: 'MISSING_SIGNATURE',
        message: 'Security signature header is missing.',
      });
    }

    // Retrieve raw body content for HMAC computation
    const rawBody = req.rawBody
      ? typeof req.rawBody === 'string'
        ? req.rawBody
        : req.rawBody.toString('utf8')
      : JSON.stringify(req.body);

    // Compute expected HMAC signatures (SHA-512 & SHA-256 support)
    const hmacSha512 = crypto
      .createHmac('sha512', strowalletConfig.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const hmacSha256 = crypto
      .createHmac('sha256', strowalletConfig.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedSig512 = Buffer.from(hmacSha512, 'utf8');
    const expectedSig256 = Buffer.from(hmacSha256, 'utf8');
    const receivedSig = Buffer.from(signatureHeader.toLowerCase(), 'utf8');

    let isValid = false;

    // Use timingSafeEqual to prevent side-channel timing attacks
    if (receivedSig.length === expectedSig512.length) {
      isValid = crypto.timingSafeEqual(receivedSig, expectedSig512);
    } else if (receivedSig.length === expectedSig256.length) {
      isValid = crypto.timingSafeEqual(receivedSig, expectedSig256);
    }

    if (!isValid) {
      console.warn(`[Security Alert] Invalid Strowallet webhook signature. Expected SHA512: ${hmacSha512}, Received: ${signatureHeader}`);
      return res.status(401).json({
        success: false,
        error: 'INVALID_SIGNATURE',
        message: 'Cryptographic signature verification failed.',
      });
    }

    // Signature and IP validated cleanly
    return next();
  }

  /**
   * Helper function to extract real client IP behind reverse proxies (Nginx / Cloudflare)
   */
  private static getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
      return ips[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
  }
}
