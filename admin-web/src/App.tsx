import React, { useState, useEffect } from 'react';

export interface DashboardMetrics {
  overview: {
    totalUserWalletSum: number;
    totalUsersCount: number;
    activeUsers: number;
    suspendedUsers: number;
    totalDailySales: number;
    dailySuccessCount: number;
    estimatedDailyProfit: number;
    activeProviderMode: 'AUTOMATIC_FAILOVER' | 'INLOMAX_PRIMARY' | 'HUSMODATA_PRIMARY';
  };
  liveProviderHealth: {
    inlomax: { name: string; balance: number; status: string };
    husmodata: { name: string; balance: number; status: string };
  };
}

export interface PlanPricingItem {
  id: string;
  network: string;
  planName: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  profitMargin: number;
}

export const AdminDashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'transactions' | 'users'>('overview');
  
  // Data State
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    overview: {
      totalUserWalletSum: 1458900.50,
      totalUsersCount: 1240,
      activeUsers: 1215,
      suspendedUsers: 25,
      totalDailySales: 384500.00,
      dailySuccessCount: 420,
      estimatedDailyProfit: 30760.00,
      activeProviderMode: 'AUTOMATIC_FAILOVER',
    },
    liveProviderHealth: {
      inlomax: { name: 'Inlomax (Primary Gateway)', balance: 185400.00, status: 'HEALTHY' },
      husmodata: { name: 'Husmodata (Fallback Gateway)', balance: 92300.00, status: 'HEALTHY' },
    },
  });

  const [providerMode, setProviderMode] = useState<'AUTOMATIC_FAILOVER' | 'INLOMAX_PRIMARY' | 'HUSMODATA_PRIMARY'>('AUTOMATIC_FAILOVER');
  const [plans, setPlans] = useState<PlanPricingItem[]>([
    { id: 'mtn_500mb', network: 'MTN', planName: 'MTN 500MB SME', category: 'SME', costPrice: 130, sellingPrice: 160, profitMargin: 30 },
    { id: 'mtn_1gb', network: 'MTN', planName: 'MTN 1.0GB SME', category: 'SME', costPrice: 240, sellingPrice: 290, profitMargin: 50 },
    { id: 'mtn_2gb', network: 'MTN', planName: 'MTN 2.0GB SME', category: 'SME', costPrice: 480, sellingPrice: 580, profitMargin: 100 },
    { id: 'air_1gb', network: 'AIRTEL', planName: 'Airtel 1.0GB CG', category: 'CG', costPrice: 250, sellingPrice: 300, profitMargin: 50 },
    { id: 'glo_1gb', network: 'GLO', planName: 'Glo 1.0GB Direct', category: 'DIRECT', costPrice: 230, sellingPrice: 280, profitMargin: 50 },
  ]);

  // Modal State for Compulsory Admin Reason Log
  const [modalAction, setModalAction] = useState<{
    type: 'FORCE_REFUND' | 'SUSPEND_USER' | 'WALLET_ADJUST' | null;
    targetId: string | null;
    targetName?: string;
    amount?: number;
    adjustType?: 'CREDIT' | 'DEBIT';
  }>({ type: null, targetId: null });

  const [adminReason, setAdminReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const handleProviderModeChange = (mode: 'AUTOMATIC_FAILOVER' | 'INLOMAX_PRIMARY' | 'HUSMODATA_PRIMARY') => {
    setProviderMode(mode);
    setMetrics((prev) => ({
      ...prev,
      overview: { ...prev.overview, activeProviderMode: mode },
    }));
    setActionSuccessMsg(`Provider failover strategy updated to: ${mode}`);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const handleUpdatePrice = (planId: string, newSellingPrice: number) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, sellingPrice: newSellingPrice, profitMargin: newSellingPrice - p.costPrice }
          : p
      )
    );
    setActionSuccessMsg(`Updated plan pricing successfully.`);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const executeModalAction = () => {
    if (!adminReason || adminReason.trim().length < 5) {
      alert('Compulsory Admin Audit Reason is required (min 5 characters).');
      return;
    }

    if (modalAction.type === 'FORCE_REFUND') {
      setActionSuccessMsg(`Transaction ${modalAction.targetId} successfully force-refunded. Audit log recorded.`);
    } else if (modalAction.type === 'SUSPEND_USER') {
      setActionSuccessMsg(`User status updated cleanly. Audit reason logged.`);
    } else if (modalAction.type === 'WALLET_ADJUST') {
      setActionSuccessMsg(`Manual wallet ${modalAction.adjustType} of ₦${modalAction.amount} executed successfully.`);
    }

    setModalAction({ type: null, targetId: null });
    setAdminReason('');
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#38bdf8' }}>
            VTU Platform Admin Console
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#94a3b8' }}>
            Real-time Telecommunication Gateways & Financial Audit Engine
          </p>
        </div>

        {/* Dynamic Provider Mode Indicator Badge */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #38bdf850', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>
          <span style={{ color: '#94a3b8' }}>Active Strategy: </span>
          <strong style={{ color: '#38bdf8' }}>{providerMode}</strong>
        </div>
      </div>

      {actionSuccessMsg ? (
        <div style={{ backgroundColor: '#22c55e20', border: '1px solid #22c55e', color: '#22c55e', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
          ✅ {actionSuccessMsg}
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'overview', label: '📊 Overview & Live Gateways' },
          { key: 'pricing', label: '🏷 Data Plan Pricing Manager' },
          { key: 'transactions', label: '⚡ Transaction Monitor & Refunds' },
          { key: 'users', label: '👥 User Ledger Management' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              backgroundColor: activeTab === tab.key ? '#0284c7' : '#1e293b',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & LIVE PROVIDER BALANCES */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Performance Indicators Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>TOTAL USER WALLETS SUM</span>
              <h2 style={{ fontSize: '24px', margin: '8px 0 0', color: '#38bdf8' }}>
                ₦{metrics.overview.totalUserWalletSum.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Across {metrics.overview.totalUsersCount} registered users</span>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>DAILY SALES VOLUME</span>
              <h2 style={{ fontSize: '24px', margin: '8px 0 0', color: '#22c55e' }}>
                ₦{metrics.overview.totalDailySales.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{metrics.overview.dailySuccessCount} successful VTU orders today</span>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>ESTIMATED DAILY PROFIT</span>
              <h2 style={{ fontSize: '24px', margin: '8px 0 0', color: '#eab308' }}>
                ₦{metrics.overview.estimatedDailyProfit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>~8% average network markup margin</span>
            </div>
          </div>

          {/* Live Provider API Balances */}
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: '#ffffff' }}>
            Live Provider API Balances & Health
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '16px', color: '#ffffff' }}>Inlomax API Gateway</strong>
                <span style={{ backgroundColor: '#22c55e20', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                  HEALTHY
                </span>
              </div>
              <p style={{ fontSize: '26px', fontWeight: 800, margin: '12px 0 4px', color: '#38bdf8' }}>
                ₦{metrics.liveProviderHealth.inlomax.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Configured Primary VTU Provider</span>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '16px', color: '#ffffff' }}>Husmodata API Gateway</strong>
                <span style={{ backgroundColor: '#22c55e20', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                  HEALTHY
                </span>
              </div>
              <p style={{ fontSize: '26px', fontWeight: 800, margin: '12px 0 4px', color: '#38bdf8' }}>
                ₦{metrics.liveProviderHealth.husmodata.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Configured Secondary Fallback Provider</span>
            </div>
          </div>

          {/* Fallback Mode Switcher Controls */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700 }}>Provider Fallback Mode Switcher</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Select dispatch execution strategy. Automatic Failover routes orders through Inlomax first and automatically fails over to Husmodata if Inlomax encounters timeout or gateway errors.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { mode: 'AUTOMATIC_FAILOVER', label: '⚡ Automatic Failover (Recommended)' },
                { mode: 'INLOMAX_PRIMARY', label: '1️⃣ Force Inlomax Only' },
                { mode: 'HUSMODATA_PRIMARY', label: '2️⃣ Force Husmodata Only' },
              ].map((item) => (
                <button
                  key={item.mode}
                  onClick={() => handleProviderModeChange(item.mode as any)}
                  style={{
                    backgroundColor: providerMode === item.mode ? '#0284c7' : '#0f172a',
                    color: providerMode === item.mode ? '#ffffff' : '#94a3b8',
                    border: '1px solid #334155',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA PLAN PRICING MANAGER */}
      {activeTab === 'pricing' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>Data Plan Markup & Pricing Manager</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Network</th>
                <th style={{ padding: '12px' }}>Plan Name</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>Provider Cost (₦)</th>
                <th style={{ padding: '12px' }}>Retail Selling Price (₦)</th>
                <th style={{ padding: '12px' }}>Profit Margin (₦)</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{plan.network}</td>
                  <td style={{ padding: '12px' }}>{plan.planName}</td>
                  <td style={{ padding: '12px', color: '#38bdf8' }}>{plan.category}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>₦{plan.costPrice}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#ffffff' }}>₦{plan.sellingPrice}</td>
                  <td style={{ padding: '12px', color: '#22c55e', fontWeight: 700 }}>+₦{plan.profitMargin}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => {
                        const price = prompt(`Enter new selling price for ${plan.planName}:`, plan.sellingPrice.toString());
                        if (price && !isNaN(Number(price))) {
                          handleUpdatePrice(plan.id, Number(price));
                        }
                      }}
                      style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Edit Price
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: TRANSACTION MONITOR & FORCE REFUND */}
      {activeTab === 'transactions' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>Transaction Monitor & Force Refund</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Reference</th>
                <th style={{ padding: '12px' }}>User</th>
                <th style={{ padding: '12px' }}>Service</th>
                <th style={{ padding: '12px' }}>Recipient</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'tx_101', ref: 'STR_REF_98711', user: 'Habib Abubakar', service: 'MTN DATA 1GB', phone: '08031234567', amount: 290, status: 'SUCCESS' },
                { id: 'tx_102', ref: 'STR_REF_98712', user: 'Amina Bello', service: 'AIRTEL AIRTIME', phone: '08029998877', amount: 1000, status: 'FAILED' },
                { id: 'tx_103', ref: 'STR_REF_98713', user: 'Chinedu Okonkwo', service: 'GLO DATA 2GB', phone: '08051112233', amount: 560, status: 'PENDING' },
              ].map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{tx.ref}</td>
                  <td style={{ padding: '12px' }}>{tx.user}</td>
                  <td style={{ padding: '12px', color: '#38bdf8' }}>{tx.service}</td>
                  <td style={{ padding: '12px' }}>{tx.phone}</td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>₦{tx.amount}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      backgroundColor: tx.status === 'SUCCESS' ? '#22c55e20' : tx.status === 'FAILED' ? '#ef444420' : '#eab30820',
                      color: tx.status === 'SUCCESS' ? '#22c55e' : tx.status === 'FAILED' ? '#ef4444' : '#eab308',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => setModalAction({ type: 'FORCE_REFUND', targetId: tx.ref, amount: tx.amount })}
                      style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginRight: '6px' }}
                    >
                      Force Refund
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>User Account & Wallet Audit</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>User Name</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Phone</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Wallet Balance</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'usr_1', name: 'Habib Abubakar', email: 'habib@vtu.ng', phone: '08031234567', status: 'ACTIVE', balance: 24850.50 },
                { id: 'usr_2', name: 'Amina Bello', email: 'amina@vtu.ng', phone: '08099887766', status: 'ACTIVE', balance: 1200.00 },
                { id: 'usr_3', name: 'Badmus John', email: 'badmus@vtu.ng', phone: '07034445566', status: 'SUSPENDED', balance: 0.00 },
              ].map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{u.name}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>{u.phone}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      backgroundColor: u.status === 'ACTIVE' ? '#22c55e20' : '#ef444420',
                      color: u.status === 'ACTIVE' ? '#22c55e' : '#ef4444',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 800, color: '#38bdf8' }}>₦{u.balance.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => setModalAction({ type: 'WALLET_ADJUST', targetId: u.id, targetName: u.name, adjustType: 'CREDIT' })}
                      style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginRight: '6px' }}
                    >
                      Credit
                    </button>
                    <button
                      onClick={() => setModalAction({ type: 'SUSPEND_USER', targetId: u.id, targetName: u.name })}
                      style={{ backgroundColor: '#334155', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* COMPULSORY ADMIN REASON MODAL */}
      {modalAction.type && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#ffffff' }}>
              Confirm {modalAction.type}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8' }}>
              Compulsory Security Audit: Provide a detailed admin justification log.
            </p>

            {modalAction.type === 'WALLET_ADJUST' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Adjustment Amount (₦):</label>
                <input
                  type="number"
                  defaultValue="1000"
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '10px', borderRadius: '8px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>Compulsory Admin Reason (Min 5 chars):</label>
              <textarea
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="e.g. Approved manual refund per customer service complaint ticket #9822"
                rows={3}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '10px', borderRadius: '8px', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setModalAction({ type: null, targetId: null })}
                style={{ backgroundColor: '#334155', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={executeModalAction}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
              >
                Confirm & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardApp;
