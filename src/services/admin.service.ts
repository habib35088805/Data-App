import { Prisma, UserStatus, TransactionStatus, LedgerType, ProviderEnum } from '@prisma/client';
import { prisma } from '../config/db';
import { WalletService } from './wallet.service';
import { InlomaxProvider } from '../providers/inlomax.provider';
import { HusmodataProvider } from '../providers/husmodata.provider';

export type DispatcherMode = 'AUTOMATIC_FAILOVER' | 'INLOMAX_PRIMARY' | 'HUSMODATA_PRIMARY';

export interface PlanPricingItem {
  id: string;
  network: string;
  planName: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  profitMargin: number;
}

let activeProviderMode: DispatcherMode = 'AUTOMATIC_FAILOVER';

let planPricingStore: PlanPricingItem[] = [
  { id: 'mtn_500mb', network: 'MTN', planName: 'MTN 500MB SME', category: 'SME', costPrice: 130, sellingPrice: 160, profitMargin: 30 },
  { id: 'mtn_1gb', network: 'MTN', planName: 'MTN 1.0GB SME', category: 'SME', costPrice: 240, sellingPrice: 290, profitMargin: 50 },
  { id: 'mtn_2gb', network: 'MTN', planName: 'MTN 2.0GB SME', category: 'SME', costPrice: 480, sellingPrice: 580, profitMargin: 100 },
  { id: 'mtn_5gb', network: 'MTN', planName: 'MTN 5.0GB SME', category: 'SME', costPrice: 1200, sellingPrice: 1450, profitMargin: 250 },
  { id: 'air_1gb', network: 'AIRTEL', planName: 'Airtel 1.0GB CG', category: 'CG', costPrice: 250, sellingPrice: 300, profitMargin: 50 },
  { id: 'glo_1gb', network: 'GLO', planName: 'Glo 1.0GB Direct', category: 'DIRECT', costPrice: 230, sellingPrice: 280, profitMargin: 50 },
];

export class AdminService {
  private static inlomax = new InlomaxProvider();
  private static husmodata = new HusmodataProvider();

  public static async getDashboardOverview() {
    const walletSumResult = await prisma.wallet.aggregate({
      _sum: { balance: true },
      _count: { id: true },
    });

    const totalUserWalletSum = walletSumResult._sum.balance
      ? new Prisma.Decimal(walletSumResult._sum.balance).toNumber()
      : 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const salesResult = await prisma.transaction.aggregate({
      where: {
        status: TransactionStatus.SUCCESS,
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalDailySales = salesResult._sum.amount
      ? new Prisma.Decimal(salesResult._sum.amount).toNumber()
      : 0;

    const [inlomaxBalance, husmodataBalance] = await Promise.all([
      this.inlomax.checkBalance().catch(() => 0),
      this.husmodata.checkBalance().catch(() => 0),
    ]);

    const userStats = await prisma.user.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const activeUsers = userStats.find((s) => s.status === UserStatus.ACTIVE)?._count.id || 0;
    const suspendedUsers = userStats.find((s) => s.status === UserStatus.SUSPENDED)?._count.id || 0;

    return {
      overview: {
        totalUserWalletSum,
        totalUsersCount: walletSumResult._count.id,
        activeUsers,
        suspendedUsers,
        totalDailySales,
        dailySuccessCount: salesResult._count.id,
        estimatedDailyProfit: Math.round(totalDailySales * 0.08 * 100) / 100,
        activeProviderMode,
      },
      liveProviderHealth: {
        inlomax: {
          name: 'Inlomax (Primary)',
          balance: inlomaxBalance || 45200.0,
          status: inlomaxBalance > 0 ? 'HEALTHY' : 'WARNING',
        },
        husmodata: {
          name: 'Husmodata (Fallback)',
          balance: husmodataBalance || 28950.0,
          status: husmodataBalance > 0 ? 'HEALTHY' : 'WARNING',
        },
      },
    };
  }

  public static setProviderMode(mode: DispatcherMode) {
    activeProviderMode = mode;
    console.log(`[Admin] Active VTU Dispatcher Provider Mode updated to: ${mode}`);
    return { success: true, activeProviderMode };
  }

  public static getProviderMode(): DispatcherMode {
    return activeProviderMode;
  }

  public static getPlanPricing(): PlanPricingItem[] {
    return planPricingStore;
  }

  public static updatePlanPricing(planId: string, sellingPrice: number, costPrice?: number) {
    const plan = planPricingStore.find((p) => p.id === planId);
    if (!plan) {
      throw new Error(`Data plan pricing item not found for ID: ${planId}`);
    }

    if (costPrice !== undefined) plan.costPrice = costPrice;
    plan.sellingPrice = sellingPrice;
    plan.profitMargin = plan.sellingPrice - plan.costPrice;

    console.log(`[Admin] Updated pricing for plan ${plan.planName}: Cost ₦${plan.costPrice} | Selling ₦${plan.sellingPrice} | Margin ₦${plan.profitMargin}`);
    return plan;
  }

  public static async getTransactions(params: {
    status?: TransactionStatus;
    phone?: string;
    reference?: string;
    limit?: number;
    offset?: number;
  }) {
    const { status, phone, reference, limit = 50, offset = 0 } = params;

    const whereClause: Prisma.TransactionWhereInput = {};

    if (status) whereClause.status = status;
    if (phone) whereClause.phoneNumber = { contains: phone };
    if (reference) whereClause.reference = { contains: reference };

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { user: { select: { fullName: true, email: true, phone: true } } },
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    return { transactions, totalCount };
  }

  public static async forceRefundTransaction(transactionId: string, adminReason: string) {
    if (!adminReason || adminReason.trim().length < 5) {
      throw new Error('ADMIN_REASON_REQUIRED: A compulsory admin reason (min 5 chars) is required for force refunds.');
    }

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx) {
      throw new Error(`Transaction not found for ID: ${transactionId}`);
    }

    const refundReference = `FORCE_REFUND_${tx.reference}`;
    const amount = new Prisma.Decimal(tx.amount).toNumber();

    const creditResult = await WalletService.credit({
      userId: tx.userId,
      amount,
      reference: refundReference,
      description: `[Admin Force Refund] ${adminReason.trim()} (Original Ref: ${tx.reference})`,
    });

    const updatedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.FAILED },
    });

    console.log(`🛡 [Admin Force Refund Executed] Tx ID: ${transactionId} | Amount: ₦${amount} | Reason: ${adminReason}`);

    return {
      success: true,
      transaction: updatedTx,
      refundResult: creditResult,
      adminReason,
    };
  }

  public static async getUsers(searchQuery?: string, limit = 50, offset = 0) {
    const whereClause: Prisma.UserWhereInput = searchQuery
      ? {
          OR: [
            { fullName: { contains: searchQuery } },
            { email: { contains: searchQuery } },
            { phone: { contains: searchQuery } },
          ],
        }
      : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: { wallet: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return { users, totalCount };
  }

  public static async toggleUserStatus(userId: string, status: UserStatus, adminReason: string) {
    if (!adminReason || adminReason.trim().length < 5) {
      throw new Error('ADMIN_REASON_REQUIRED: A compulsory admin reason is required for status changes.');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    console.log(`[Admin] User ID ${userId} status changed to ${status}. Reason: ${adminReason}`);
    return updatedUser;
  }

  public static async adminManualWalletAdjustment(params: {
    userId: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    adminReason: string;
  }) {
    const { userId, type, amount, adminReason } = params;

    if (!adminReason || adminReason.trim().length < 5) {
      throw new Error('ADMIN_REASON_REQUIRED: A compulsory admin reason is required for manual wallet adjustments.');
    }

    const reference = `ADMIN_ADJUST_${Date.now()}`;
    const description = `[Admin Manual ${type}] ${adminReason.trim()}`;

    if (type === 'CREDIT') {
      return await WalletService.credit({ userId, amount, reference, description });
    } else {
      return await WalletService.debit({ userId, amount, reference, description });
    }
  }
}
