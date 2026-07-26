import { Router, Request, Response, NextFunction } from 'express';
import { AdminService, DispatcherMode } from '../services/admin.service';
import { UserStatus, TransactionStatus } from '@prisma/client';

const router = Router();

// 1. Dashboard Overview Metrics & Live Provider Balances
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AdminService.getDashboardOverview();
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// 2. Fallback Mode Switcher
router.post('/provider-mode', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mode } = req.body;
    if (!mode || !['AUTOMATIC_FAILOVER', 'INLOMAX_PRIMARY', 'HUSMODATA_PRIMARY'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MODE',
        message: 'mode must be AUTOMATIC_FAILOVER, INLOMAX_PRIMARY, or HUSMODATA_PRIMARY.',
      });
    }

    const result = AdminService.setProviderMode(mode as DispatcherMode);
    return res.json({ success: true, message: `Active provider mode updated to ${mode}`, data: result });
  } catch (error) {
    next(error);
  }
});

// 3. Data Plan Pricing Manager
router.get('/plans', (_req: Request, res: Response) => {
  const plans = AdminService.getPlanPricing();
  return res.json({ success: true, data: plans });
});

router.put('/plans/:planId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;
    const { sellingPrice, costPrice } = req.body;

    if (!sellingPrice || Number(sellingPrice) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PRICE',
        message: 'sellingPrice must be greater than zero.',
      });
    }

    const updated = AdminService.updatePlanPricing(
      planId,
      Number(sellingPrice),
      costPrice !== undefined ? Number(costPrice) : undefined
    );

    return res.json({ success: true, message: 'Plan pricing updated successfully.', data: updated });
  } catch (error) {
    next(error);
  }
});

// 4. Transaction Monitor & Force Refund
router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as TransactionStatus | undefined;
    const phone = req.query.phone as string | undefined;
    const reference = req.query.reference as string | undefined;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const result = await AdminService.getTransactions({ status, phone, reference, limit, offset });
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/transactions/:id/refund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { adminReason } = req.body;

    if (!adminReason || typeof adminReason !== 'string' || adminReason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'ADMIN_REASON_REQUIRED',
        message: 'A compulsory admin reason (min 5 characters) is required to execute a force refund.',
      });
    }

    const result = await AdminService.forceRefundTransaction(id, adminReason);
    return res.json({ success: true, message: 'Transaction force refunded successfully.', data: result });
  } catch (error) {
    next(error);
  }
});

// 5. User Management & Manual Wallet Adjustment
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string | undefined;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const result = await AdminService.getUsers(search, limit, offset);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, adminReason } = req.body;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Status must be ACTIVE or SUSPENDED.',
      });
    }

    if (!adminReason || typeof adminReason !== 'string' || adminReason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'ADMIN_REASON_REQUIRED',
        message: 'A compulsory admin reason (min 5 characters) is required to alter user account status.',
      });
    }

    const user = await AdminService.toggleUserStatus(id, status as UserStatus, adminReason);
    return res.json({ success: true, message: `User status updated to ${status}.`, data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/users/:id/wallet-adjust', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, amount, adminReason } = req.body;

    if (!type || !['CREDIT', 'DEBIT'].includes(type) || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PARAMETERS',
        message: 'type (CREDIT/DEBIT) and valid positive amount are required.',
      });
    }

    if (!adminReason || typeof adminReason !== 'string' || adminReason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'ADMIN_REASON_REQUIRED',
        message: 'A compulsory admin reason (min 5 characters) is required for manual wallet adjustments.',
      });
    }

    const result = await AdminService.adminManualWalletAdjustment({
      userId: id,
      type: type as 'CREDIT' | 'DEBIT',
      amount: Number(amount),
      adminReason,
    });

    return res.json({ success: true, message: `User wallet ${type}ED successfully.`, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
