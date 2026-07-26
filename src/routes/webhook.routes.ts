import { Router } from 'express';
import express from 'express';
import { StrowalletWebhookSecurity, CustomRequest } from '../middleware/strowalletSecurity.middleware';
import { StrowalletWebhookController } from '../controllers/strowalletWebhook.controller';

const router = Router();

const rawBodySaver = (req: CustomRequest, _res: any, buf: Buffer, encoding: string) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString((encoding as BufferEncoding) || 'utf8');
  }
};

router.use(express.json({ verify: rawBodySaver }));

router.post(
  '/strowallet',
  (req, res, next) => StrowalletWebhookSecurity.verifyWebhookSecurity(req as CustomRequest, res, next),
  (req, res) => StrowalletWebhookController.handleWebhook(req, res)
);

export default router;
