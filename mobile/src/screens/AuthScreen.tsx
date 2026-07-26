import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { ShieldCheck, Fingerprint, Lock, Phone } from 'lucide-react-native';
import { SecurityService } from '../services/security.service';
import { useVtuStore } from '../store/useVtuStore';

export const AuthScreen: React.FC = () => {
  const [phone, setPhone] = useState('08031234567');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loginStore = useVtuStore((state) => state.login);

  const handlePasswordLogin = () => {
    if (!phone || !password) {
      setErrorMsg('Please enter both phone number and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginStore({
        userId: 'usr_demo_8899',
        fullName: 'Habib Abubakar',
        email: 'habib@vtuplatform.ng',
        phone,
      });
    }, 1000);
  };

  const handleBiometricUnlock = async () => {
    setIsLoading(true);
    const success = await SecurityService.authenticateWithBiometrics('Log in to VTU Platform');
    setIsLoading(false);

    if (success) {
      loginStore({
        userId: 'usr_demo_8899',
        fullName: 'Habib Abubakar',
        email: 'habib@vtuplatform.ng',
        phone: '08031234567',
      });
    } else {
      setErrorMsg('Biometric authentication cancelled or unverified.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', paddingHorizontal: 24 }}>
      
      {/* Brand Header */}
      <View style={{ alignItems: 'center', marginBottom: 36 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#38bdf820', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <ShieldCheck size={36} color="#38bdf8" />
        </View>
        <Text style={{ color: '#ffffff', fontSize: 26, fontWeight: '800' }}>VTU Platform</Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>Fast Nigerian Data & Airtime Top-Up</Text>
      </View>

      {/* Form Card */}
      <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#334155' }}>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 20 }}>Welcome Back</Text>

        {errorMsg ? <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{errorMsg}</Text> : null}

        {/* Phone Field */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Phone Number</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#334155' }}>
            <Phone size={18} color="#64748b" />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="08012345678"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
              style={{ flex: 1, color: '#ffffff', fontSize: 15, paddingVertical: 12, marginLeft: 10 }}
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Password</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#334155' }}>
            <Lock size={18} color="#64748b" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
              style={{ flex: 1, color: '#ffffff', fontSize: 15, paddingVertical: 12, marginLeft: 10 }}
            />
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handlePasswordLogin}
          disabled={isLoading}
          style={{ backgroundColor: '#0284c7', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Biometric Quick Login Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#334155' }} />
          <Text style={{ color: '#64748b', fontSize: 12, marginHorizontal: 12 }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#334155' }} />
        </View>

        {/* TouchID / FaceID Login */}
        <TouchableOpacity
          onPress={handleBiometricUnlock}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            borderRadius: 12,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: '#38bdf850',
          }}
        >
          <Fingerprint size={22} color="#38bdf8" />
          <Text style={{ color: '#38bdf8', fontSize: 15, fontWeight: '700', marginLeft: 10 }}>
            Biometric Quick Unlock
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};
