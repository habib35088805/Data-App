import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Copy, Check, Building2, CreditCard } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

interface StrowalletAccountCardProps {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

export const StrowalletAccountCard: React.FC<StrowalletAccountCardProps> = ({
  accountNumber,
  bankName,
  accountName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 18, marginVertical: 12, borderWidth: 1, borderColor: '#334155' }}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Building2 size={18} color="#38bdf8" />
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Automated Wallet Top-Up
          </Text>
        </View>
        <View style={{ backgroundColor: '#0284c720', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: '700' }}>STROWALLET</Text>
        </View>
      </View>

      {/* Account Number & Copy Action */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}>
        <View>
          <Text style={{ color: '#64748b', fontSize: 11 }}>Dedicated Virtual Account</Text>
          <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800', letterSpacing: 1, marginTop: 2 }}>
            {accountNumber}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCopy}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: copied ? '#22c55e20' : '#0f172a',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: copied ? '#22c55e' : '#334155',
          }}
        >
          {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} color="#38bdf8" />}
          <Text style={{ color: copied ? '#22c55e' : '#38bdf8', fontSize: 12, fontWeight: '700', marginLeft: 6 }}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bank Name & Account Name */}
      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155', flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#64748b', fontSize: 10 }}>BANK NAME</Text>
          <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{bankName}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: '#64748b', fontSize: 10 }}>ACCOUNT NAME</Text>
          <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{accountName}</Text>
        </View>
      </View>

    </View>
  );
};
