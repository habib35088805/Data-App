export class PhoneNormalizer {
  /**
   * Normalizes any input phone number format into canonical 11-digit local Nigerian format (08031234567).
   * Handles +2348031234567, 2348031234567, 8031234567, 08031234567.
   */
  public static toLocalFormat(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('234') && cleaned.length === 13) {
      cleaned = '0' + cleaned.slice(3);
    } else if (cleaned.length === 10 && !cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }

    return cleaned;
  }

  /**
   * Normalizes any input phone number into canonical international E.164 format (+2348031234567).
   */
  public static toE164Format(phone: string): string {
    const local = this.toLocalFormat(phone);
    if (local.startsWith('0') && local.length === 11) {
      return '+234' + local.slice(1);
    }
    return '+' + local;
  }

  /**
   * Validates if string represents a valid Nigerian mobile phone number.
   */
  public static isValidNigerianPhone(phone: string): boolean {
    const local = this.toLocalFormat(phone);
    // Standard Nigerian mobile numbers are 11 digits starting with 07, 08, or 09
    const regex = /^(070|080|081|090|091)\d{8}$/;
    return regex.test(local);
  }
}
