import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Eye, EyeOff, Smartphone, Wifi, History, Plus, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react-native';
import { useVtuStore } from '../store/useVtuStore';
import { StrowalletAccountCard } from '../components/StrowalletAccountCard';

interface DashboardScreenProps {
  onNavigateToPurchase: (type: 'DATA' | 'AIRTIME') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToPurchase }) => {
  const {
    fullName,
    walletBalance,
    isBalanceVisible,
    toggleBalanceVisibility,
    strowalletAccount,
    transactions,
  } = useVtuStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Top User Greeting Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>Welcome back 👋</Text>
            <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>{fullName}</Text>
          </View>

          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#0284c720', justifyContent: 'center', alignItems: 'center' }}>
            <ShieldCheck size={24} color="#38bdf8" />
          </View>
        </View>

        {/* Wallet Balance Hero Card */}
        <View style={{ backgroundColor: '#0284c7', borderRadius: 20, padding: 22, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#e0f2fe', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Wallet Balance
            </Text>
            <TouchableOpacity onPress={toggleBalanceVisibility} style={{ padding: 4 }}>
              {isBalanceVisible ? <EyeOff size={20} color="#ffffff" /> : <Eye size={20} color="#ffffff" />}
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '900', marginVertical: 10, letterSpacing: 0.5 }}>
            {isBalanceVisible ? `₦${walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '₦ ••••••••'}
          </Text>

          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => onNavigateToPurchase('DATA')}
              style={{ backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginRight: 10 }}
            >
              <Plus size={16} color="#0284c7" />
              <Text style={{ color: '#0284c7', fontSize: 13, fontWeight: '700', marginLeft: 4 }}>Top-Up Services</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Strowallet Dedicated Virtual Account Card */}
        <StrowalletAccountCard
          accountNumber={strowalletAccount.accountNumber}
          bankName={strowalletAccount.bankName}
          accountName={strowalletAccount.accountName}
        />

        {/* Quick Action Grid */}
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginVertical: 14 }}>Quick Services</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          {/* Buy Data */}
          <TouchableOpacity
            onPress={() => onNavigateToPurchase('DATA')}
            style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#334155' }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#0284c720', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Wifi size={24} color="#38bdf8" />
            </View>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>Buy Data</Text>
            <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>SME & Direct</Text>
          </TouchableOpacity>

          {/* Buy Airtime */}
          <TouchableOpacity
            onPress={() => onNavigateToPurchase('AIRTIME')}
            style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, alignItems: 'center', marginLeft: 10, borderWidth: 1, borderColor: '#334155' }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#22c55e20', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Smartphone size={24} color="#22c55e" />
            </View>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>Buy Airtime</Text>
            <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Instant VTU</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions List */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={{ color: '#38bdf8', fontSize: 13, fontWeight: '600' }}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((tx) => (
          <View
            key={tx.id}
            style={{ backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: tx.type === 'DATA' ? '#0284c720' : '#22c55e20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                {tx.type === 'DATA' ? <Wifi size={18} color="#38bdf8" /> : <Smartphone size={18} color="#22c55e" />}
              </View>
              <View>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>{tx.network} {tx.type}</Text>
                <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{tx.phone} • {tx.date}</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>-₦{tx.amount.toFixed(2)}</Text>
              <View style={{ backgroundColor: '#22c55e20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}>
                <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '700' }}>{tx.status}</Text>
              </View>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};
