import express, { Request, Response, NextFunction } from 'express';
import { WalletService } from './services/wallet.service';
import { StrowalletService } from './services/strowallet.service';
import { VtuDispatcherService } from './services/vtuDispatcher.service';
import webhookRoutes from './routes/webhook.routes';
import adminRoutes from './routes/admin.routes';
import { WalletBaseError } from './errors/wallet.errors';
import { prisma } from './config/db';

const app = express();
const vtuDispatcher = new VtuDispatcherService();

// 1. Webhook routes (custom raw body parser for HMAC verification)
app.use('/api/v1/webhooks', webhookRoutes);

// 2. Admin Management REST APIs
app.use('/api/v1/admin', adminRoutes);

// Standard JSON Parser
app.use(express.json());

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Nigerian VTU Platform API, Dispatcher & Admin Engine', timestamp: new Date() });
});

// User Onboarding Endpoint
app.post('/api/v1/users/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, phone, password, transactionPin, bvn, nin } = req.body;

    if (!fullName || !email || !phone || !password || !transactionPin) {
      return res.status(400).json({
        success: false,
        error: 'MissingRequiredFields',
        message: 'fullName, email, phone, password, and transactionPin are required.',
      });
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash: password,
        transactionPinHash: transactionPin,
      },
    });

    const virtualAccount = await StrowalletService.createVirtualAccount({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      bvn,
      nin,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered and Virtual Bank Account generated successfully.',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          status: user.status,
        },
        virtualAccount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// VTU Purchase Dispatch Endpoint
app.post('/api/v1/vtu/dispatcher/purchase', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, transactionPin, serviceType, network, phoneNumber, amount, planId, reference } = req.body;

    if (!userId || !transactionPin || !serviceType || !network || !phoneNumber || !amount || !reference) {
      return res.status(400).json({
        success: false,
        error: 'MissingRequiredFields',
        message: 'userId, transactionPin, serviceType, network, phoneNumber, amount, and reference are required.',
      });
    }

    const result = await vtuDispatcher.processPurchase({
      userId,
      transactionPin,
      serviceType,
      network,
      phoneNumber,
      amount: Number(amount),
      planId,
      reference,
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    next(error);
  }
});

// Fetch User Wallet & Balance
app.get('/api/v1/wallet/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const wallet = await WalletService.getWallet(userId);
    res.json({ success: true, data: wallet });
  } catch (error) {
    next(error);
  }
});

// Centralized Error Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof WalletBaseError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      details: err.toJSON(),
    });
  }

  if (err.message && err.message.startsWith('ADMIN_REASON_REQUIRED')) {
    return res.status(400).json({
      success: false,
      error: 'ADMIN_REASON_REQUIRED',
      message: err.message,
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'DUPLICATE_KEY_ERROR',
      message: `Unique constraint failed on field(s): ${(err.meta?.target as string[])?.join(', ')}`,
    });
  }

  console.error('Unhandled Application Error:', err);
  return res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected server error occurred.',
  });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ [VTU Platform Server] Listening on http://localhost:${PORT}`);
  });
}

export default app;
