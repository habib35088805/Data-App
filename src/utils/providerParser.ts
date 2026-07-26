import { VtuProviderStatus } from '../providers/vtuProvider.interface';

export interface EvaluatedProviderResponse {
  isSuccess: boolean;
  isPending: boolean;
  status: VtuProviderStatus;
  providerReference?: string;
  errorMessage?: string;
  rawBody: any;
}

export class ProviderParser {
  /**
   * Defensive Provider Response Evaluator
   * Eliminates HTTP 200 False Positives by inspecting payload body contents for hidden failure signals.
   */
  public static evaluateResponse(data: any): EvaluatedProviderResponse {
    if (!data || typeof data !== 'object') {
      return {
        isSuccess: false,
        isPending: false,
        status: 'FAILED',
        errorMessage: 'Invalid or empty provider response body',
        rawBody: data,
      };
    }

    const rawStatus = String(data.status || data.Status || data.code || '').toLowerCase();
    const message = String(data.message || data.api_response || data.error || '').toLowerCase();

    // Check for explicit failure keywords inside payload body even if HTTP was 200 OK
    const failureKeywords = [
      'failed',
      'failure',
      'insufficient',
      'low balance',
      'error',
      'invalid plan',
      'maintenance',
      'unauthorized',
    ];

    const hasFailureKeyword = failureKeywords.some((keyword) => message.includes(keyword));

    if (rawStatus === 'failed' || rawStatus === 'error' || data.code === 400 || data.code === 500 || hasFailureKeyword) {
      return {
        isSuccess: false,
        isPending: false,
        status: 'FAILED',
        providerReference: data.id || data.reference || data.order_id,
        errorMessage: data.message || data.api_response || 'Provider processing error in payload body',
        rawBody: data,
      };
    }

    if (rawStatus === 'pending' || rawStatus === 'processing' || data.code === 201) {
      return {
        isSuccess: false,
        isPending: true,
        status: 'PENDING',
        providerReference: data.id || data.reference || data.order_id,
        rawBody: data,
      };
    }

    if (rawStatus === 'success' || rawStatus === 'successful' || data.code === 200) {
      return {
        isSuccess: true,
        isPending: false,
        status: 'SUCCESS',
        providerReference: data.id || data.reference || data.order_id,
        rawBody: data,
      };
    }

    // Default fallback
    return {
      isSuccess: false,
      isPending: false,
      status: 'FAILED',
      errorMessage: 'Unrecognized provider payload state',
      rawBody: data,
    };
  }
}
