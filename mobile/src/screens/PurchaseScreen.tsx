import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Wifi, Smartphone, Users, CheckCircle2, ChevronDown, Contact } from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import { useVtuStore, DataPlan } from '../store/useVtuStore';
import { detectNetworkFromPrefix, NetworkType } from '../utils/networkDetector';
import { PinKeypadModal } from '../components/PinKeypadModal';

const NETWORK_COLORS: Record<NetworkType, { bg: string; text: string; border: string }> = {
  MTN: { bg: '#fef08a20', text: '#eab308', border: '#eab308' },
  AIRTEL: { bg: '#fee2e220', text: '#ef4444', border: '#ef4444' },
  GLO: { bg: '#dcfce720', text: '#22c55e', border: '#22c55e' },
  NINE_MOBILE: { bg: '#0284c720', text: '#38bdf8', border: '#38bdf8' },
};

const DATA_PLANS: Record<NetworkType, DataPlan[]> = {
  MTN: [
    { id: 'mtn_500mb', name: 'MTN 500MB SME', size: '500MB', validity: '30 Days', price: 160 },
    { id: 'mtn_1gb', name: 'MTN 1.0GB SME', size: '1.0GB', validity: '30 Days', price: 290 },
    { id: 'mtn_2gb', name: 'MTN 2.0GB SME', size: '2.0GB', validity: '30 Days', price: 580 },
    { id: 'mtn_5gb', name: 'MTN 5.0GB SME', size: '5.0GB', validity: '30 Days', price: 1450 },
    { id: 'mtn_10gb', name: 'MTN 10.0GB Corporate', size: '10.0GB', validity: '30 Days', price: 2900 },
  ],
  AIRTEL: [
    { id: 'air_1gb', name: 'Airtel 1.0GB CG', size: '1.0GB', validity: '30 Days', price: 300 },
    { id: 'air_2gb', name: 'Airtel 2.0GB CG', size: '2.0GB', validity: '30 Days', price: 600 },
    { id: 'air_5gb', name: 'Airtel 5.0GB CG', size: '5.0GB', validity: '30 Days', price: 1500 },
  ],
  GLO: [
    { id: 'glo_1gb', name: 'Glo 1.0GB Direct', size: '1.0GB', validity: '30 Days', price: 280 },
    { id: 'glo_2gb', name: 'Glo 2.0GB Direct', size: '2.0GB', validity: '30 Days', price: 560 },
  ],
  NINE_MOBILE: [
    { id: '9mob_1gb', name: '9Mobile 1.0GB SME', size: '1.0GB', validity: '30 Days', price: 320 },
  ],
};

export const PurchaseScreen: React.FC = () => {
  const {
    selectedNetwork,
    setSelectedNetwork,
    selectedServiceType,
    setSelectedServiceType,
    selectedCategory,
    setSelectedCategory,
    phoneNumber,
    setPhoneNumber,
    selectedPlan,
    setSelectedPlan,
    airtimeAmount,
    setAirtimeAmount,
    isPinModalOpen,
    openPinModal,
    closePinModal,
    addTransaction,
    updateBalanceAfterPurchase,
  } = useVtuStore();

  const [autoDetected, setAutoDetected] = useState<NetworkType | null>(null);

  // Auto-detect network when user types phone prefix
  useEffect(() => {
    if (phoneNumber.length >= 4) {
      const detected = detectNetworkFromPrefix(phoneNumber);
      if (detected && detected !== selectedNetwork) {
        setAutoDetected(detected);
        setSelectedNetwork(detected);
      }
    } else {
      setAutoDetected(null);
    }
  }, [phoneNumber]);

  // Pick Contact from Phonebook using expo-contacts
  const handleOpenContactPicker = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0 && data[0].phoneNumbers && data[0].phoneNumbers.length > 0) {
          const number = data[0].phoneNumbers[0].number || '';
          const cleaned = number.replace(/\D/g, '');
          setPhoneNumber(cleaned);
        } else {
          Alert.alert('Contacts', 'No contacts found on device.');
        }
      } else {
        Alert.alert('Permission Denied', 'Permission to access contacts was denied.');
      }
    } catch (err: any) {
      setPhoneNumber('08031234567');
    }
  };

  const handleProceed = () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 11-digit phone number.');
      return;
    }

    if (selectedServiceType === 'DATA' && !selectedPlan) {
      Alert.alert('Select Data Plan', 'Please select a data bundle plan.');
      return;
    }

    const purchaseAmount = selectedServiceType === 'DATA' ? selectedPlan!.price : Number(airtimeAmount);

    openPinModal(`Authorize ${selectedNetwork} ${selectedServiceType}`, {
      network: selectedNetwork,
      serviceType: selectedServiceType,
      phoneNumber,
      amount: purchaseAmount,
      planId: selectedPlan?.id,
    });
  };

  const handlePinSuccess = async (pin: string) => {
    const purchaseAmount = selectedServiceType === 'DATA' ? selectedPlan!.price : Number(airtimeAmount);

    addTransaction({
      id: `tx_${Date.now()}`,
      reference: `STR_VTU_${Date.now()}`,
      type: selectedServiceType,
      network: selectedNetwork,
      phone: phoneNumber,
      amount: purchaseAmount,
      status: 'SUCCESS',
      date: 'Just now',
    });

    updateBalanceAfterPurchase(purchaseAmount);

    Alert.alert(
      '🎉 Order Successful!',
      `Your ${selectedNetwork} ${selectedServiceType} purchase of ₦${purchaseAmount.toFixed(2)} for ${phoneNumber} was processed successfully!`
    );
  };

  const currentPlans: DataPlan[] = DATA_PLANS[selectedNetwork] || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800', marginBottom: 16 }}>Purchase VTU</Text>

        {/* Service Type Switcher (DATA vs AIRTIME) */}
        <View style={{ flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setSelectedServiceType('DATA')}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: selectedServiceType === 'DATA' ? '#0284c7' : 'transparent',
              borderRadius: 10,
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Data Bundle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedServiceType('AIRTIME')}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: selectedServiceType === 'AIRTIME' ? '#0284c7' : 'transparent',
              borderRadius: 10,
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Airtime VTU</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Network Selector Badges */}
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' }}>
          Select Telecom Network {autoDetected ? `(Auto-detected ${autoDetected})` : ''}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          {(['MTN', 'AIRTEL', 'GLO', 'NINE_MOBILE'] as NetworkType[]).map((net) => {
            const isSelected = selectedNetwork === net;
            const color = NETWORK_COLORS[net];

            return (
              <TouchableOpacity
                key={net}
                onPress={() => setSelectedNetwork(net)}
                style={{
                  flex: 1,
                  backgroundColor: isSelected ? color.bg : '#1e293b',
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginHorizontal: 4,
                  borderWidth: 2,
                  borderColor: isSelected ? color.border : '#334155',
                }}
              >
                <Text style={{ color: isSelected ? color.text : '#94a3b8', fontSize: 13, fontWeight: '800' }}>
                  {net === 'NINE_MOBILE' ? '9Mobile' : net}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Category Selector (SME, CG, Direct) for Data */}
        {selectedServiceType === 'DATA' && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' }}>
              Data Category
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {(['SME', 'CG', 'DIRECT'] as const).map((cat: 'SME' | 'CG' | 'DIRECT') => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    flex: 1,
                    backgroundColor: selectedCategory === cat ? '#0284c720' : '#1e293b',
                    borderRadius: 10,
                    paddingVertical: 8,
                    alignItems: 'center',
                    marginHorizontal: 4,
                    borderWidth: 1,
                    borderColor: selectedCategory === cat ? '#38bdf8' : '#334155',
                  }}
                >
                  <Text style={{ color: selectedCategory === cat ? '#38bdf8' : '#94a3b8', fontSize: 12, fontWeight: '700' }}>
                    {cat === 'CG' ? 'Corp Gifting' : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 3. Phone Number Input with Contact Picker */}
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>
          Recipient Phone Number
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 20 }}>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="08031234567"
            placeholderTextColor="#475569"
            keyboardType="phone-pad"
            maxLength={11}
            style={{ flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 12, fontWeight: '600' }}
          />

          <TouchableOpacity onPress={handleOpenContactPicker} style={{ backgroundColor: '#334155', padding: 8, borderRadius: 8 }}>
            <Contact size={20} color="#38bdf8" />
          </TouchableOpacity>
        </View>

        {/* 4. Plan Selector / Airtime Amount Input */}
        {selectedServiceType === 'DATA' ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' }}>
              Select Data Plan
            </Text>

            {currentPlans.map((plan: DataPlan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => setSelectedPlan(plan)}
                  style={{
                    backgroundColor: isSelected ? '#0284c720' : '#1e293b',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#38bdf8' : '#334155',
                  }}
                >
                  <View>
                    <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>{plan.name}</Text>
                    <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Validity: {plan.validity}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#38bdf8', fontSize: 16, fontWeight: '800', marginRight: 8 }}>₦{plan.price}</Text>
                    {isSelected && <CheckCircle2 size={18} color="#38bdf8" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>
              Airtime Amount (₦)
            </Text>
            <View style={{ backgroundColor: '#1e293b', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#334155' }}>
              <TextInput
                value={airtimeAmount}
                onChangeText={setAirtimeAmount}
                placeholder="1000"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', paddingVertical: 12 }}
              />
            </View>
          </View>
        )}

        {/* 5. Instant Price Preview Card */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#334155' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>Network & Service</Text>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>{selectedNetwork} {selectedServiceType}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>Recipient</Text>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>{phoneNumber || 'Not specified'}</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 10, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>Total Amount</Text>
            <Text style={{ color: '#38bdf8', fontSize: 20, fontWeight: '800' }}>
              ₦{(selectedServiceType === 'DATA' ? selectedPlan?.price || 0 : Number(airtimeAmount) || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 6. Proceed Button */}
        <TouchableOpacity
          onPress={handleProceed}
          style={{ backgroundColor: '#0284c7', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 30 }}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Proceed to Pay</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* PIN / Biometric Confirmation Modal */}
      <PinKeypadModal
        isVisible={isPinModalOpen}
        title={`Confirm ${selectedNetwork} Purchase`}
        amount={selectedServiceType === 'DATA' ? selectedPlan?.price : Number(airtimeAmount)}
        onClose={closePinModal}
        onSuccess={handlePinSuccess}
      />
    </SafeAreaView>
  );
};
