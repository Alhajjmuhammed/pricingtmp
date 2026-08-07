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
    // Real route is under /api/v1/ (confirmed against the live backend's
    // urls.py -- root mounts `authentication.urls` at `api/v1/`, which
    // nests registration under `auth/`). Registration itself never issues
    // a token (email verification is required before login does) --
    // see loginPersonalAccount, called separately right after this.
    const response = await wellongeIdApiService.post<PersonalAccountResponse>(
      '/api/v1/auth/register/',
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

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email: string };
}

/**
 * Logs in immediately after registration to obtain a Bearer token.
 * Login does NOT require email verification (only `is_active`), unlike
 * profile/organization creation below, which both require auth -- so this
 * is the real, working way to get a usable token right after signup.
 */
export async function loginPersonalAccount(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const response = await wellongeIdApiService.post<LoginResponse>(
    '/api/v1/auth/login/',
    { email, password }
  );

  // BaseApiService.post() wraps the ENTIRE backend response body (already
  // {success, message, data: {access_token, ...}}) as `data` again on top
  // of its own {success: true, data} envelope -- so a successful call
  // lands the real payload at response.data.data, not response.data. Every
  // other wellongeIdService call gets this same unwrap via onboardingApi.ts's
  // wrappers; this one was assumed not to need it and wasn't, which meant
  // a real, successful login was read as a failure by anything checking
  // response.data.access_token directly.
  if (response.success && response.data) {
    const backendData = (response.data as any).data || response.data;
    return {
      success: true,
      data: backendData as LoginResponse,
    };
  }

  return response;
}

function authHeader(accessToken?: string) {
  return accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
}

export async function createPersonalProfile(
  input: CreatePersonalProfileInput,
  accessToken?: string
): Promise<ApiResponse<PersonalProfileResponse>> {
  // Requires auth (IsAuthenticated on the real backend) -- pass the token
  // from loginPersonalAccount, called right after registration.
  return await wellongeIdApiService.post<PersonalProfileResponse>(
    `/api/v1/accounts/${input.personal_account_id}/profiles/`,
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
    },
    authHeader(accessToken)
  );
}

export async function createPersonalPreferences(
  input: CreatePersonalPreferencesInput,
  accessToken?: string
): Promise<ApiResponse<PersonalPreferencesResponse>> {
  return await wellongeIdApiService.post<PersonalPreferencesResponse>(
    `/api/v1/accounts/${input.personal_account_id}/preferences/`,
    {
      language: input.language,
      timezone: input.timezone,
      notifications: input.notifications,
      privacy: input.privacy,
    },
    authHeader(accessToken)
  );
}

export async function createOrganization(
  input: CreateOrganizationInput,
  accessToken?: string
): Promise<ApiResponse<OrganizationResponse>> {
  // Requires auth, and organization_type must be one of the real backend's
  // choices: company | non_profit | government | educational | business |
  // other (NOT the caller's internal "prebuilt_plan"/"custom_plan"
  // tracking value -- that's a different concept, kept separate).
  return await wellongeIdApiService.post<OrganizationResponse>(
    '/api/v1/organizations/',
    {
      name: input.name,
      legal_name: input.legal_name,
      slug: input.slug,
      industry: input.industry,
      size: input.size,
      entity_type: input.entity_type || 'company',
      organization_type: input.organization_type || 'business',
      primary_email: input.primary_email,
      primary_phone: input.primary_phone,
      personal_account_owner_id: input.personal_account_owner_id,
      address: input.address,
    },
    authHeader(accessToken)
  );
}

export async function requestEmailVerificationCode(
  email: string,
  platform?: string,
  firstName?: string
): Promise<ApiResponse<any>> {
  return await localOtpApiService.post('/v1/auth/verify/email/', {
    email,
    platform: platform || 'eopsentre',
    first_name: firstName,
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
  platform?: string,
  firstName?: string
): Promise<ApiResponse<any>> {
  return await localOtpApiService.post('/v1/auth/verify/resend/', {
    verification_type: 'email',
    contact_value: email,
    platform: platform || 'eopsentre',
    first_name: firstName,
  });
}
