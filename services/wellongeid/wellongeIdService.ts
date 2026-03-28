/**
 * Wellonge ID REST API Service
 */

import { wellongeIdApiService, localOtpApiService, ApiResponse } from '../core/api';

export interface RegisterPersonalAccountInput {
  email: string;
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  accept_terms?: boolean;
  platform?: string;
}

export interface PersonalAccountResponse {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  token?: string;
}

export interface CreatePersonalProfileInput {
  personal_account_id: string;
  phone_number?: string;
  date_of_birth?: string;
  location?: string;
  country?: string;
  job_title?: string;
  preferred_contact?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  languages?: string[];
}

export interface PersonalProfileResponse {
  id: string;
  personal_account_id: string;
  phone_number?: string;
  date_of_birth?: string;
  location?: string;
  headline?: string;
}

export interface CreatePersonalPreferencesInput {
  personal_account_id: string;
  language?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  };
  privacy?: {
    profile_visibility?: string;
  };
}

export interface PersonalPreferencesResponse {
  id: string;
  personal_account_id: string;
  language?: string;
  timezone?: string;
  notifications?: any;
}

export interface CreateOrganizationInput {
  name: string;
  legal_name?: string;
  slug?: string;
  industry?: string;
  size?: string;
  entity_type?: string;
  organization_type?: string;
  primary_email?: string;
  primary_phone?: string;
  personal_account_owner_id: string;
  address?: any;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug?: string;
  industry?: string;
  size?: string;
  personal_account_owner_id: string;
}

export async function registerPersonalAccount(
  input: RegisterPersonalAccountInput
): Promise<ApiResponse<PersonalAccountResponse>> {
  try {
    const response = await wellongeIdApiService.post<PersonalAccountResponse>(
      '/v1/auth/register/',
      {
        email: input.email,
        username: input.username || input.email,
        password: input.password,
        first_name: input.first_name,
        last_name: input.last_name,
        accept_terms: input.accept_terms ?? true,
        platform: input.platform || 'eopsentre',
      }
    );

    if (response.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.token);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to register account',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

export async function createPersonalProfile(
  input: CreatePersonalProfileInput
): Promise<ApiResponse<PersonalProfileResponse>> {
  return await wellongeIdApiService.post<PersonalProfileResponse>(
    `/v1/personal-accounts/${input.personal_account_id}/profiles/`,
    {
      phone_number: input.phone_number,
      date_of_birth: input.date_of_birth,
      location: input.location,
      country: input.country,
      job_title: input.job_title,
      preferred_contact: input.preferred_contact,
      headline: input.headline,
      bio: input.bio,
      skills: input.skills,
      languages: input.languages,
    }
  );
}

export async function createPersonalPreferences(
  input: CreatePersonalPreferencesInput
): Promise<ApiResponse<PersonalPreferencesResponse>> {
  return await wellongeIdApiService.post<PersonalPreferencesResponse>(
    `/v1/personal-accounts/${input.personal_account_id}/preferences/`,
    {
      language: input.language,
      timezone: input.timezone,
      notifications: input.notifications,
      privacy: input.privacy,
    }
  );
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<ApiResponse<OrganizationResponse>> {
  return await wellongeIdApiService.post<OrganizationResponse>(
    '/v1/organizations/',
    {
      name: input.name,
      legal_name: input.legal_name,
      slug: input.slug,
      industry: input.industry,
      size: input.size,
      entity_type: input.entity_type,
      organization_type: input.organization_type,
      primary_email: input.primary_email,
      primary_phone: input.primary_phone,
      personal_account_owner_id: input.personal_account_owner_id,
      address: input.address,
    }
  );
}

export async function requestEmailVerificationCode(
  email: string,
  platform?: string
): Promise<ApiResponse<any>> {
  // Use local backend (localhost:8001) for OTP during development
  return await localOtpApiService.post('/v1/auth/verify/email/', {
    email,
    platform: platform || 'eopsentre',
  });
}

export async function verifyEmailCode(
  code: string,
  email?: string
): Promise<ApiResponse<any>> {
  // Use local backend (localhost:8001) for OTP during development
  return await localOtpApiService.post('/v1/auth/verify/code/', {
    code,
    verification_type: 'email',
    contact_value: email,
  });
}

export async function resendEmailVerificationCode(
  email?: string,
  platform?: string
): Promise<ApiResponse<any>> {
  // Use local backend (localhost:8001) for OTP during development
  return await localOtpApiService.post('/v1/auth/verify/resend/', {
    verification_type: 'email',
    contact_value: email,
    platform: platform || 'eopsentre',
  });
}
