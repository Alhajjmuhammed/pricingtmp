/**
 * Wellonge ID Sync Service
 *
 * Mirrors user registration data to the Wellonge ID backend (port 8002).
 * This is a NON-BLOCKING secondary call — it runs after the primary
 * registration flow completes. If Wellonge ID is unreachable, registration
 * still succeeds normally.
 *
 * Wellonge ID is the central identity system for all platforms.
 * Every registered user must also exist there.
 *
 * Sync steps (in order):
 *  1. Register PersonalAccount  → POST /v1/auth/register/
 *  2. Create PersonalProfile    → POST /v1/personal-accounts/{id}/profiles/
 *  3. Create Organization       → POST /v1/organizations/  (captures org ID)
 *  4. Create EopsentreAccount   → POST /graphql/ (mutation: createEopsentreAccount)
 *     Links the user to their organization inside the eOpsEntre platform.
 */

const WELLONGE_ID_BASE_URL =
  process.env.NEXT_PUBLIC_WELLONGE_ID_URL || 'http://localhost:8002';

const WELLONGE_ID_GRAPHQL_URL = `${WELLONGE_ID_BASE_URL}/graphql/`;

// ─── Input / Output types ────────────────────────────────────────────────────

export interface WellongeIdSyncInput {
  // Account info
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  // Profile info
  phoneNumber: string;
  country: string;
  jobTitle?: string;
  dateOfBirth?: string;
  // Organization info
  orgName: string;
  orgSlug?: string;
  industry?: string;
  orgSize?: string;
  organizationType?: string;
  // Tracking
  platform?: string;
  personalAccountId?: string; // ID from primary backend for cross-reference
}

export interface WellongeIdSyncResult {
  success: boolean;
  wellongeAccountId?: string;
  wellongeOrgId?: string;
  eopsentreAccountId?: string;
  message?: string;
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

async function wellongeIdPost<T>(endpoint: string, data: object): Promise<T> {
  const response = await fetch(`${WELLONGE_ID_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(10000), // 10s — keep short, this is non-blocking
  });

  const result = await response.json();

  if (!response.ok) {
    // Registration endpoint wraps errors as: { error: { code, message, details } }
    // Other endpoints use top-level: { message: "..." }
    throw new Error(
      result?.error?.message || result?.message || result?.detail || `HTTP ${response.status}`
    );
  }

  return result;
}

async function wellongeIdGraphQL<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(WELLONGE_ID_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors.map((e: any) => e.message).join(', '));
  }

  return result.data as T;
}

// ─── GraphQL mutation ────────────────────────────────────────────────────────

const CREATE_EOPSENTRE_ACCOUNT = `
  mutation CreateEopsentreAccount($input: CreateEopsentreAccountInput!) {
    createEopsentreAccount(input: $input) {
      id
      email
      username
    }
  }
`;

// ─── Main sync function ──────────────────────────────────────────────────────

/**
 * Sync a newly registered user to Wellonge ID (port 8002).
 *
 * Each step is wrapped individually — a failure in one step is logged
 * but does NOT stop later steps or throw to the caller.
 */
export async function syncUserToWellongeId(
  input: WellongeIdSyncInput
): Promise<WellongeIdSyncResult> {
  console.log('[wellonge-id-sync] Starting sync to Wellonge ID (port 8002)...');

  let wellongeAccountId: string | undefined;
  let wellongeOrgId: string | undefined;
  let eopsentreAccountId: string | undefined;

  // ── Step 1: Register PersonalAccount ───────────────────────────────────────
  // Wellonge ID enforces minimum 8-character passwords.
  // If the password is shorter, skip the sync entirely rather than fail.
  if (!input.password || input.password.length < 8) {
    console.warn(
      '[wellonge-id-sync] ⚠️ Password is shorter than 8 characters — Wellonge ID sync skipped'
    );
    return { success: false, message: 'Password too short for Wellonge ID (min 8 chars)' };
  }

  try {
    const accountResult: any = await wellongeIdPost('/api/v1/auth/register/', {
      email: input.email,
      username: input.email,
      password: input.password,
      first_name: input.firstName,
      last_name: input.lastName,
      accept_terms: true,
      platform: input.platform || 'eopsentre',
      ...(input.personalAccountId && {
        external_account_id: input.personalAccountId,
      }),
    });

    wellongeAccountId =
      accountResult?.data?.user_id ||
      accountResult?.data?.id ||
      accountResult?.id;

    console.log('[wellonge-id-sync] ✅ Step 1: PersonalAccount created, ID:', wellongeAccountId);
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('already') || msg.includes('exists') || msg.includes('409')) {
      console.warn('[wellonge-id-sync] ⚠️ Step 1: Account already exists in Wellonge ID — skipping');
    } else {
      console.warn('[wellonge-id-sync] ⚠️ Step 1: PersonalAccount creation failed:', err?.message);
      // Cannot continue without an account ID
      return { success: false, message: err?.message };
    }
  }

  if (!wellongeAccountId) {
    console.warn('[wellonge-id-sync] ⚠️ No Wellonge account ID — skipping remaining steps');
    return { success: false, message: 'Could not obtain Wellonge account ID' };
  }

  // ── Step 2: Create PersonalProfile ─────────────────────────────────────────
  try {
    await wellongeIdPost(
      `/api/v1/personal-accounts/${wellongeAccountId}/profiles/`,
      {
        phone_number: input.phoneNumber,
        country: input.country,
        job_title: input.jobTitle,
        date_of_birth: input.dateOfBirth || undefined,
      }
    );
    console.log('[wellonge-id-sync] ✅ Step 2: PersonalProfile created');
  } catch (err: any) {
    // Non-fatal — account exists, profile can be completed later
    console.warn('[wellonge-id-sync] ⚠️ Step 2: PersonalProfile creation failed:', err?.message);
  }

  // ── Step 3: Create Organization ─────────────────────────────────────────────
  try {
    const orgResult: any = await wellongeIdPost('/api/v1/organizations/', {
      name: input.orgName,
      legal_name: input.orgName,
      slug: input.orgSlug,
      industry: input.industry,
      size: input.orgSize,
      organization_type: input.organizationType,
      personal_account_owner_id: wellongeAccountId,
      primary_email: input.email,
      primary_phone: input.phoneNumber,
    });

    // Capture org ID — needed for EopsentreAccount in Step 4
    wellongeOrgId =
      orgResult?.data?.id ||
      orgResult?.id;

    console.log('[wellonge-id-sync] ✅ Step 3: Organization created, ID:', wellongeOrgId);
  } catch (err: any) {
    console.warn('[wellonge-id-sync] ⚠️ Step 3: Organization creation failed:', err?.message);
  }

  // ── Step 4: Create EopsentreAccount (via GraphQL) ───────────────────────────
  // Links the user to their organization inside the eOpsEntre platform.
  // Requires org ID from Step 3 — skip if org creation failed.
  if (wellongeOrgId) {
    try {
      const eopsentreResult: any = await wellongeIdGraphQL(
        CREATE_EOPSENTRE_ACCOUNT,
        {
          input: {
            email: input.email,
            username: input.email,
            password: input.password,
            firstName: input.firstName,
            lastName: input.lastName,
            organizationId: wellongeOrgId,
            isActive: true,
            metadata: {
              // Cross-reference IDs for traceability
              personal_account_id: wellongeAccountId,
              external_account_id: input.personalAccountId || null,
              registered_via: 'pricingtmp',
            },
          },
        }
      );

      eopsentreAccountId = eopsentreResult?.createEopsentreAccount?.id;
      console.log(
        '[wellonge-id-sync] ✅ Step 4: EopsentreAccount created, ID:',
        eopsentreAccountId
      );
    } catch (err: any) {
      console.warn(
        '[wellonge-id-sync] ⚠️ Step 4: EopsentreAccount creation failed:',
        err?.message
      );
    }
  } else {
    console.warn(
      '[wellonge-id-sync] ⚠️ Step 4: Skipping EopsentreAccount — no org ID available'
    );
  }

  console.log('[wellonge-id-sync] Sync to Wellonge ID complete');
  return {
    success: true,
    wellongeAccountId,
    wellongeOrgId,
    eopsentreAccountId,
  };
}
