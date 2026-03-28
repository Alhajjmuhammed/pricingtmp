/**
 * Onboarding API Service for pricingtmp
 */

import {
  registerPersonalAccount as wellongeIdRegisterAccount,
  createPersonalProfile as wellongeIdCreateProfile,
  createPersonalPreferences as wellongeIdCreatePreferences,
  createOrganization as wellongeIdCreateOrganization,
} from '../wellongeid/wellongeIdService';

import {
  processPayment as wellongepayProcessPayment,
  checkPaymentStatus as wellongepayCheckStatus,
} from '../wellongepay/wellongepayService';

export type OnboardingErrorType =
  | 'EMAIL_EXISTS'
  | 'RATE_LIMIT'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface RegisterAccountResponse {
  success: boolean;
  data?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    token?: string;
  };
  error?: string;
  errorType?: OnboardingErrorType;
}

export async function registerPersonalAccount(input: {
  email: string;
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  accept_terms?: boolean;
  platform?: string;
}): Promise<RegisterAccountResponse> {
  console.log('[onboarding] registerPersonalAccount - Request');

  try {
    const response = await wellongeIdRegisterAccount({
      email: input.email,
      username: input.username,
      password: input.password,
      first_name: input.first_name,
      last_name: input.last_name,
      accept_terms: input.accept_terms ?? true,
      platform: input.platform || 'eopsentre',
    });

    if (response.success && response.data) {
      const backendData = (response.data as any).data || response.data;

      return {
        success: true,
        data: {
          id: backendData.user_id || backendData.id,
          email: backendData.email,
          username: backendData.username,
          firstName: backendData.first_name || '',
          lastName: backendData.last_name || '',
          createdAt: backendData.created_at,
          token: backendData.token
        },
      };
    }

    const message = (response.message || '').toLowerCase();
    let errorType: OnboardingErrorType = 'UNKNOWN_ERROR';
    let errorMessage = response.message || 'Failed to register account';

    if (message.includes('409') || message.includes('already registered')) {
      errorType = 'EMAIL_EXISTS';
      errorMessage = 'This email is already registered. Please log in.';
    } else if (message.includes('429') || message.includes('rate limit')) {
      errorType = 'RATE_LIMIT';
      errorMessage = 'Too many attempts. Please try again later.';
    }

    return {
      success: false,
      error: errorMessage,
      errorType,
    };
  } catch (error: any) {
    console.error('[onboarding] registerPersonalAccount - Exception:', error);
    return {
      success: false,
      error: error?.message || 'An unexpected error occurred',
      errorType: 'NETWORK_ERROR',
    };
  }
}

export async function createPersonalProfile(input: {
  personal_account_id: string;
  phone_number?: string;
  date_of_birth?: string;
  location?: string;
  country?: string;
  job_title?: string;
  preferred_contact?: string;
  headline?: string;
  bio?: string;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await wellongeIdCreateProfile({
      personal_account_id: input.personal_account_id,
      phone_number: input.phone_number,
      date_of_birth: input.date_of_birth,
      location: input.location,
      country: input.country,
      job_title: input.job_title,
      preferred_contact: input.preferred_contact,
      headline: input.headline,
      bio: input.bio,
    });

    return {
      success: response.success,
      data: (response.data as any)?.data || response.data,
      error: response.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to create profile',
    };
  }
}

export async function createPersonalPreferences(input: {
  personal_account_id: string;
  language?: string;
  timezone?: string;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await wellongeIdCreatePreferences({
      personal_account_id: input.personal_account_id,
      language: input.language,
      timezone: input.timezone,
    });

    return {
      success: response.success,
      data: (response.data as any)?.data || response.data,
      error: response.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to create preferences',
    };
  }
}

export async function createOrganization(input: {
  name: string;
  legal_name?: string;
  slug?: string;
  industry?: string;
  size?: string;
  personal_account_owner_id: string;
  primary_email?: string;
  primary_phone?: string;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await wellongeIdCreateOrganization({
      name: input.name,
      legal_name: input.legal_name,
      slug: input.slug,
      industry: input.industry,
      size: input.size,
      entity_type: 'company',
      organization_type: 'business',
      personal_account_owner_id: input.personal_account_owner_id,
      primary_email: input.primary_email,
      primary_phone: input.primary_phone,
    });

    return {
      success: response.success,
      data: (response.data as any)?.data || response.data,
      error: response.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to create organization',
    };
  }
}

// Re-export payment functions
export { processPayment, checkPaymentStatus } from '../wellongepay/wellongepayService';
