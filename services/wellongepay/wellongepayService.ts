/**
 * Wellongepay REST API Service
 */

import { wellongepayApiService, ApiResponse } from '../core/api';

export interface ProcessPaymentInput {
  paymentMethod: 'card' | 'mpesa';
  amount: number;
  currency: string;
  organizationId?: string;
  personalAccountId?: string;
  subscriptionId?: string;
  invoiceId?: string;
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  billingAddress?: {
    fullName: string;
    email: string;
    city: string;
    country: string;
    street: string;
    zipCode: string;
  };
  mpesaPhone?: string;
  cart?: {
    items: Array<{
      itemName: string;
      itemType: string;
      productId?: string;
      quantity: number;
      price: number;
    }>;
  };
}

export interface PaymentResponse {
  success: boolean;
  payment_id?: string;
  transaction_id?: string;
  transaction_reference?: string;
  payment_link?: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  customer_message?: string;
  error?: string;
  message?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'success' | 'declined';
  transaction_id?: string;
  amount?: number;
  currency?: string;
  payment_method?: string;
  error?: string;
  message?: string;
}

export async function processPayment(
  input: ProcessPaymentInput
): Promise<ApiResponse<PaymentResponse>> {
  try {
    console.info('[wellongepay] Processing payment:', {
      method: input.paymentMethod,
      amount: input.amount,
      currency: input.currency,
    });

    if (input.paymentMethod === 'card') {
      const payload = {
        amount: input.amount,
        currency: input.currency,
        description: `Payment for ${input.cart?.items.map(i => i.itemName).join(', ') || 'subscription'}`,
        customer_email: input.billingAddress?.email,
        customer_name: input.billingAddress?.fullName,
        return_url: typeof window !== 'undefined' ? window.location.origin + '/payment/callback' : undefined,
        metadata: {
          organization_id: input.organizationId,
          personal_account_id: input.personalAccountId,
          subscription_id: input.subscriptionId,
          invoice_id: input.invoiceId,
          cart: input.cart,
          billing_address: input.billingAddress,
        },
      };

      const response = await wellongepayApiService.post<PaymentResponse>('/payments/ngenius/payment/create/', payload);

      if (response.success && response.data) {
        console.info('[wellongepay] Card payment created successfully');
        return {
          success: true,
          data: {
            success: true,
            payment_id: response.data.transaction_id || response.data.payment_id,
            transaction_id: response.data.transaction_id,
            payment_link: response.data.payment_link,
          },
        };
      }

      console.error('[wellongepay] Card payment failed:', response.message);
      return {
        success: false,
        message: response.data?.error || response.message || 'Payment processing failed',
        errors: [response.data?.error || response.message || 'Unknown error'],
      };
    } else if (input.paymentMethod === 'mpesa') {
      if (!input.mpesaPhone) {
        return {
          success: false,
          message: 'M-PESA phone number is required',
          errors: ['M-PESA phone number is required'],
        };
      }

      const mpesaPayload = {
        phone_number: input.mpesaPhone,
        amount: input.amount,
        description: `Payment for ${input.cart?.items.map(i => i.itemName).join(', ') || 'subscription'}`,
        metadata: {
          organization_id: input.organizationId,
          personal_account_id: input.personalAccountId,
          subscription_id: input.subscriptionId,
          invoice_id: input.invoiceId,
          cart: input.cart,
        },
      };

      const response = await wellongepayApiService.post<PaymentResponse>('/payments/mpesa/process/', mpesaPayload);

      if (response.success && response.data) {
        console.info('[wellongepay] M-PESA payment initiated');
        return {
          success: true,
          data: {
            success: true,
            payment_id: response.data.checkout_request_id || response.data.transaction_reference,
            transaction_id: response.data.transaction_reference,
            checkout_request_id: response.data.checkout_request_id,
            merchant_request_id: response.data.merchant_request_id,
            customer_message: response.data.customer_message || response.data.message,
          },
        };
      }

      return {
        success: false,
        message: response.data?.error || response.message || 'M-PESA payment processing failed',
        errors: [response.data?.error || response.message || 'Unknown error'],
      };
    } else {
      return {
        success: false,
        message: 'Invalid payment method',
        errors: ['Payment method must be "card" or "mpesa"'],
      };
    }
  } catch (error) {
    console.error('[wellongepay] Payment error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Payment processing failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

export async function checkPaymentStatus(
  paymentId: string,
  paymentMethod: 'card' | 'mpesa'
): Promise<ApiResponse<PaymentStatusResponse>> {
  try {
    console.info('[wellongepay] Checking payment status:', { paymentId, paymentMethod });

    let response: ApiResponse<PaymentStatusResponse>;
    if (paymentMethod === 'card') {
      response = await wellongepayApiService.get<PaymentStatusResponse>(`/payments/ngenius/payment/${paymentId}/status/`);
    } else if (paymentMethod === 'mpesa') {
      response = await wellongepayApiService.post<PaymentStatusResponse>('/payments/mpesa/status/', { checkout_request_id: paymentId });
    } else {
      return {
        success: false,
        message: 'Invalid payment method',
        errors: ['Payment method must be "card" or "mpesa"'],
      };
    }

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to check payment status',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
