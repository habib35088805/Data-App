import express, { Request, Response, NextFunction } from 'express';
import { WalletService } from './services/wallet';
import { StrowalletService } from './services/strowallet.service';
import webhookRoutes from './routes/webhook.routes';
import { WalletBaseError } from './errors/wallet.errors';
import { prisma } from './config/db';

const app = express();

app.use('/api/v1/webhooks', webhookRoutes);
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Nigerian VTU Platform API & Strowallet Engine', timestamp: new Date() });
});

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

app.get('/api/v1/wallet/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const wallet = await WalletService.getWallet(userId);
    res.json({ success: true, data: wallet });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/wallet/credit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, amount, reference, description } = req.body;

    if (!userId || !amount || !reference) {
      return res.status(400).json({
        success: false,
        error: 'MissingRequiredFields',
        message: 'userId, amount, and reference are required fields.',
      });
    }

    const result = await WalletService.credit({
      userId,
      amount: Number(amount),
      reference,
      description: description || 'Wallet Funding',
    });

    return res.status(200).json({
      success: true,
      message: 'Wallet funded successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/wallet/debit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, amount, reference, description, serviceType, network, phoneNumber, planId, providerUsed } = req.body;

    if (!userId || !amount || !reference || !phoneNumber || !serviceType || !network) {
      return res.status(400).json({
        success: false,
        error: 'MissingRequiredFields',
        message: 'userId, amount, reference, phoneNumber, serviceType, and network are required fields.',
      });
    }

    const debitResult = await WalletService.debit({
      userId,
      amount: Number(amount),
      reference,
      description: description || `VTU ${serviceType} purchase for ${phoneNumber}`,
    });

    const vtuTx = await prisma.transaction.create({
      data: {
        userId,
        reference,
        serviceType,
        network,
        phoneNumber,
        planId,
        amount: Number(amount),
        providerUsed: providerUsed || 'INLOMAX',
        status: 'SUCCESS',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'VTU transaction processed successfully.',
      data: {
        wallet: debitResult,
        transaction: vtuTx,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/wallet/:walletId/ledger', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletId } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const entries = await WalletService.getLedgerHistory(walletId, limit, offset);
    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof WalletBaseError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      details: err.toJSON(),
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
    message: 'An unexpected database or server error occurred.',
  });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ [VTU Platform Server] Listening on http://localhost:${PORT}`);
  });
}

export default app;
