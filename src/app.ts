import express, { Request, Response, NextFunction } from 'express';
import { WalletService } from './services/wallet.service.js';
import { WalletBaseError } from './errors/wallet.errors.js';
import { prisma } from './config/db.js';

const app = express();
app.use(express.json());

// 1. Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Nigerian VTU Platform API', timestamp: new Date() });
});

// 2. Fetch User Wallet & Balance
app.get('/api/v1/wallet/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const wallet = await WalletService.getWallet(userId);
    res.json({ success: true, data: wallet });
  } catch (error) {
    next(error);
  }
});

// 3. Fund Wallet (Credit Endpoint)
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
      description: description || 'Wallet Funding via Virtual Account',
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

// 4. Purchase Data / Airtime VTU (Debit Endpoint)
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

    // Process wallet debit inside FOR UPDATE transaction
    const debitResult = await WalletService.debit({
      userId,
      amount: Number(amount),
      reference,
      description: description || `VTU ${serviceType} purchase for ${phoneNumber}`,
    });

    // Create associated Transaction audit record
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

// 5. Ledger Entries Endpoint
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

// Centralized Structured Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof WalletBaseError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      details: err.toJSON(),
    });
  }

  // Handle Prisma Database Unique Constraint Violations
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
