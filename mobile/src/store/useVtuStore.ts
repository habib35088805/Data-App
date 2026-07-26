import { create } from 'zustand';
import { NetworkType } from '../utils/networkDetector';

export interface DataPlan {
  id: string;
  name: string;
  size: string;
  validity: string;
  price: number;
}

export interface TransactionRecord {
  id: string;
  reference: string;
  type: 'AIRTIME' | 'DATA';
  network: NetworkType;
  phone: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  date: string;
}

export interface VtuStoreState {
  // Auth & User State
  isAuthenticated: boolean;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  
  // Wallet & Strowallet Virtual Account
  walletBalance: number;
  isBalanceVisible: boolean;
  strowalletAccount: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };

  // VTU Purchase Form State
  selectedNetwork: NetworkType;
  selectedServiceType: 'DATA' | 'AIRTIME';
  selectedCategory: 'SME' | 'CG' | 'DIRECT';
  phoneNumber: string;
  selectedPlan: DataPlan | null;
  airtimeAmount: string;

  // PIN Keypad Modal State
  isPinModalOpen: boolean;
  pinModalTitle: string;
  pendingPurchasePayload: any | null;

  // Recent Transactions
  transactions: TransactionRecord[];

  // Actions
  toggleBalanceVisibility: () => void;
  setSelectedNetwork: (network: NetworkType) => void;
  setSelectedServiceType: (type: 'DATA' | 'AIRTIME') => void;
  setSelectedCategory: (category: 'SME' | 'CG' | 'DIRECT') => void;
  setPhoneNumber: (phone: string) => void;
  setSelectedPlan: (plan: DataPlan | null) => void;
  setAirtimeAmount: (amount: string) => void;
  openPinModal: (title: string, payload: any) => void;
  closePinModal: () => void;
  login: (userData: { userId: string; fullName: string; email: string; phone: string }) => void;
  logout: () => void;
  addTransaction: (tx: TransactionRecord) => void;
  updateBalanceAfterPurchase: (amount: number) => void;
}

export const useVtuStore = create<VtuStoreState>((set) => ({
  isAuthenticated: true,
  userId: 'usr_demo_8899',
  fullName: 'Habib Abubakar',
  email: 'habib@vtuplatform.ng',
  phone: '08031234567',

  walletBalance: 24850.50,
  isBalanceVisible: true,

  strowalletAccount: {
    accountNumber: '8031234567',
    bankName: 'Wema Bank (Strowallet)',
    accountName: 'Habib Abubakar / VTU App',
  },

  selectedNetwork: 'MTN',
  selectedServiceType: 'DATA',
  selectedCategory: 'SME',
  phoneNumber: '',
  selectedPlan: null,
  airtimeAmount: '1000',

  isPinModalOpen: false,
  pinModalTitle: 'Confirm Transaction',
  pendingPurchasePayload: null,

  transactions: [
    {
      id: 'tx_1',
      reference: 'STR_VTU_99881',
      type: 'DATA',
      network: 'MTN',
      phone: '08031234567',
      amount: 1200,
      status: 'SUCCESS',
      date: 'Today, 2:45 PM',
    },
    {
      id: 'tx_2',
      reference: 'STR_VTU_99882',
      type: 'AIRTIME',
      network: 'AIRTEL',
      phone: '08029998877',
      amount: 500,
      status: 'SUCCESS',
      date: 'Yesterday, 10:15 AM',
    },
  ],

  toggleBalanceVisibility: () => set((state: VtuStoreState) => ({ isBalanceVisible: !state.isBalanceVisible })),
  setSelectedNetwork: (network: NetworkType) => set({ selectedNetwork: network, selectedPlan: null }),
  setSelectedServiceType: (type: 'DATA' | 'AIRTIME') => set({ selectedServiceType: type }),
  setSelectedCategory: (category: 'SME' | 'CG' | 'DIRECT') => set({ selectedCategory: category, selectedPlan: null }),
  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),
  setSelectedPlan: (plan: DataPlan | null) => set({ selectedPlan: plan }),
  setAirtimeAmount: (amount: string) => set({ airtimeAmount: amount }),

  openPinModal: (title: string, payload: any) => set({ isPinModalOpen: true, pinModalTitle: title, pendingPurchasePayload: payload }),
  closePinModal: () => set({ isPinModalOpen: false, pendingPurchasePayload: null }),

  login: (userData: { userId: string; fullName: string; email: string; phone: string }) => set({ ...userData, isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),

  addTransaction: (tx: TransactionRecord) => set((state: VtuStoreState) => ({ transactions: [tx, ...state.transactions] })),
  updateBalanceAfterPurchase: (amount: number) => set((state: VtuStoreState) => ({ walletBalance: state.walletBalance - amount })),
}));
