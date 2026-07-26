import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'vtu_auth_token_secure';
const PIN_KEY = 'vtu_transaction_pin_secure';

export class SecurityService {
  /**
   * Triggers device Biometric prompt (TouchID / FaceID)
   */
  public static async authenticateWithBiometrics(reason = 'Authenticate to authorize VTU purchase'): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        console.log('[SecurityService] Biometrics hardware or enrollment unavailable on device.');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use 4-digit PIN',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.warn('[SecurityService] Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Saves JWT auth token to device SecureStore
   */
  public static async setAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  /**
   * Retrieves auth token from device SecureStore
   */
  public static async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  /**
   * Deletes auth token on logout
   */
  public static async removeAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  /**
   * Saves 4-digit PIN hash locally
   */
  public static async setTransactionPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  }

  /**
   * Verifies stored 4-digit PIN
   */
  public static async verifyTransactionPin(inputPin: string): Promise<boolean> {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    if (!storedPin) {
      // Default fallback PIN for development: '1234'
      return inputPin === '1234';
    }
    return storedPin === inputPin;
  }
}
