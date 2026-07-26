import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Delete, Fingerprint, Lock, X } from 'lucide-react-native';
import { SecurityService } from '../services/security.service';

interface PinKeypadModalProps {
  isVisible: boolean;
  title?: string;
  amount?: number;
  onClose: () => void;
  onSuccess: (pin: string) => Promise<void> | void;
}

export const PinKeypadModal: React.FC<PinKeypadModalProps> = ({
  isVisible,
  title = 'Confirm Transaction PIN',
  amount,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isVisible) {
      setPin('');
      setErrorMsg('');
      setIsLoading(false);
    }
  }, [isVisible]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        verifyAndSubmit(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    const success = await SecurityService.authenticateWithBiometrics('Authorize VTU purchase with FaceID/TouchID');
    setIsLoading(false);

    if (success) {
      try {
        await onSuccess('1234');
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Transaction authorization failed.');
      }
    } else {
      setErrorMsg('Biometric authentication failed. Please enter your 4-digit PIN.');
    }
  };

  const verifyAndSubmit = async (inputPin: string) => {
    setIsLoading(true);
    try {
      const isValid = await SecurityService.verifyTransactionPin(inputPin);
      if (!isValid) {
        setIsLoading(false);
        setErrorMsg('Invalid 4-digit PIN. Please try again.');
        setPin('');
        return;
      }

      await onSuccess(inputPin);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Transaction authorization failed.');
      setPin('');
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center' }}>
          
          {/* Header */}
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Lock size={20} color="#38bdf8" />
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginLeft: 8 }}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {amount && (
            <Text style={{ color: '#38bdf8', fontSize: 24, fontWeight: '800', marginVertical: 8 }}>
              ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
          )}

          <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>Enter your 4-digit security PIN to confirm</Text>

          {/* 4 Masked Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: errorMsg ? '#ef4444' : pin.length > index ? '#38bdf8' : '#475569',
                  backgroundColor: pin.length > index ? '#38bdf8' : 'transparent',
                  marginHorizontal: 12,
                }}
              />
            ))}
          </View>

          {errorMsg ? <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{errorMsg}</Text> : null}

          {isLoading ? (
            <View style={{ marginVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13 }}>Authorizing transaction...</Text>
            </View>
          ) : (
            /* Numeric Keypad Grid */
            <View style={{ width: '100%', maxWidth: 300 }}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
              ].map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  {row.map((digit) => (
                    <TouchableOpacity
                      key={digit}
                      onPress={() => handleKeyPress(digit)}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: '#334155',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '600' }}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

              {/* Bottom Row (Biometrics, 0, Backspace) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={handleBiometricAuth}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: '#0f172a',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Fingerprint size={28} color="#38bdf8" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleKeyPress('0')}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: '#334155',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '600' }}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleBackspace}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: '#0f172a',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Delete size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
};
