/**
 * Wellonge ID EopsentreAccount Link
 *
 * Links the just-registered user to their organization inside the
 * eOpsEntre-platform-specific side of Wellonge ID (createEopsentreAccount).
 * This is a NON-BLOCKING secondary call.
 *
 * IMPORTANT: this used to re-run its own register/profile/organization
 * sequence from scratch, duplicating what app/register/page.tsx's Steps
 * 1-3 already do. That never actually worked -- the re-registration call
 * hit "email already exists" (harmless), but the re-run organization
 * creation has no Bearer token and 403'd (IsAuthenticated), which meant
 * this function always skipped createEopsentreAccount silently. Confirmed
 * via a real end-to-end test with a fresh account -- see the flow-test
 * writeup. Fixed by taking the account/org IDs and the access token the
 * caller already has from Steps 1-3, instead of re-deriving them.
 */

const WELLONGE_ID_BASE_URL =
  process.env.NEXT_PUBLIC_WELLONGE_ID_URL || 'http://localhost:8002';

const WELLONGE_ID_GRAPHQL_URL = `${WELLONGE_ID_BASE_URL}/graphql/`;

export interface WellongeIdEopsentreLinkInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  personalAccountId: string; // Wellonge ID PersonalAccount id, from Step 1
  organizationId: string; // Wellonge ID Organization id, from Step 3
  accessToken: string; // from Step 1b's login
}

export interface WellongeIdSyncResult {
  success: boolean;
  eopsentreAccountId?: string;
  message?: string;
}

const CREATE_EOPSENTRE_ACCOUNT = `
  mutation CreateEopsentreAccount($input: CreateEopsentreAccountInput!) {
    createEopsentreAccount(input: $input) {
      id
      email
      username
    }
  }
`;

export async function syncUserToWellongeId(
  input: WellongeIdEopsentreLinkInput
): Promise<WellongeIdSyncResult> {
  const response = await fetch(WELLONGE_ID_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      query: CREATE_EOPSENTRE_ACCOUNT,
      variables: {
        input: {
          email: input.email,
          username: input.email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          organizationId: input.organizationId,
          isActive: true,
          metadata: {
            personal_account_id: input.personalAccountId,
            registered_via: 'pricingtmp',
          },
        },
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.json();

  if (result.errors?.length) {
    return { success: false, message: result.errors.map((e: any) => e.message).join(', ') };
  }

  const eopsentreAccountId = result.data?.createEopsentreAccount?.id;
  return { success: !!eopsentreAccountId, eopsentreAccountId };
}
