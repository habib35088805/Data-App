import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from 'react-native';
import { LayoutDashboard, ShoppingCart, LogOut } from 'lucide-react-native';
import { useVtuStore } from './src/store/useVtuStore';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PurchaseScreen } from './src/screens/PurchaseScreen';

export default function App() {
  const { isAuthenticated, logout, setSelectedServiceType } = useVtuStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'purchase'>('dashboard');

  const handleNavigateToPurchase = (type: 'DATA' | 'AIRTIME') => {
    setSelectedServiceType(type);
    setActiveTab('purchase');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        
        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
          {activeTab === 'dashboard' ? (
            <DashboardScreen onNavigateToPurchase={handleNavigateToPurchase} />
          ) : (
            <PurchaseScreen />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={{ backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155', flexDirection: 'row', paddingVertical: 10, paddingBottom: 24, justifyContent: 'space-around', alignItems: 'center' }}>
          
          {/* Dashboard Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab('dashboard')}
            style={{ alignItems: 'center', flex: 1 }}
          >
            <LayoutDashboard size={22} color={activeTab === 'dashboard' ? '#38bdf8' : '#64748b'} />
            <Text style={{ color: activeTab === 'dashboard' ? '#38bdf8' : '#64748b', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
              Dashboard
            </Text>
          </TouchableOpacity>

          {/* Purchase Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab('purchase')}
            style={{ alignItems: 'center', flex: 1 }}
          >
            <ShoppingCart size={22} color={activeTab === 'purchase' ? '#38bdf8' : '#64748b'} />
            <Text style={{ color: activeTab === 'purchase' ? '#38bdf8' : '#64748b', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
              Buy VTU
            </Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={logout}
            style={{ alignItems: 'center', flex: 1 }}
          >
            <LogOut size={22} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
              Logout
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaProvider>
  );
}
