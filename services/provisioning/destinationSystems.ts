/**
 * Post-registration provisioning into the destination systems.
 *
 * After a user registers + pays on pricingtmp, their account should also
 * exist in:
 *   1. Client User Management (clientmng) — always, every registration.
 *   2. The product they actually subscribed to:
 *      - "Tax Compliance ..." category -> backtaxcomply.registerFirm
 *      - "Buyer" / "Supplier" category -> backsupplier.register (orgType)
 *
 * All calls here are best-effort / non-blocking by design (same pattern as
 * the wellongepay subscription-creation and Wellonge ID sync steps in
 * app/register/page.tsx): the primary registration + payment has already
 * succeeded by the time these run, so a failure here is logged and
 * swallowed rather than shown to the user.
 *
 * Each destination re-creates its own login using the SAME email/password
 * the user just chose on pricingtmp, so one set of credentials works
 * across every system (confirmed direction, not a guess).
 */

const CLIENT_MGMT_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_CLIENT_MGMT_GRAPHQL_URL || 'https://backclientall.eopsprimax.com/graphql/';
const TAX_COMPLIANCE_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_TAX_COMPLIANCE_GRAPHQL_URL || 'https://backtaxcomply.eopsprimax.com/graphql/';
const SUPPLIER_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_SUPPLIER_GRAPHQL_URL || 'https://backsupplier.eopsprimax.com/graphql/';

async function graphqlPost<T>(url: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors.map((e: { message: string }) => e.message).join(', '));
  }
  return result.data;
}

/** Which destination product (if any) a category name maps to. */
export type DestinationSystem = 'tax_compliance' | 'buyer' | 'supplier' | null;

export function resolveDestinationSystem(categoryName?: string): DestinationSystem {
  if (!categoryName) return null;
  const name = categoryName.toLowerCase();
  if (name.includes('tax')) return 'tax_compliance';
  if (name.includes('buyer')) return 'buyer';
  if (name.includes('supplier')) return 'supplier';
  return null;
}

/**
 * Maps wellongepay's Feature (module) names -- the actual catalog groupings
 * an admin builds Packages out of -- to each destination product's own
 * module vocabulary, so a customer's dashboard access is scoped to what
 * they actually bought, not everything. Case-insensitive substring match on
 * the wellongepay Feature name, same heuristic used elsewhere in this app
 * (resolveDestinationSystem, CategoryIcon) since Feature names are
 * admin-managed free text, not a fixed enum.
 */
const TAX_COMPLIANCE_MODULE_MAP: Array<[string, string[]]> = [
  ['compliance', ['Documents']],
  ['filing', ['Documents']],
  ['payroll', ['Payroll']],
  ['tax', ['Tax']],
  ['hr', ['Employees']],
  ['employee', ['Employees']],
];

const SUPPLIER_PLATFORM_MODULE_MAP: Array<[string, string[]]> = [
  ['procurement', ['Orders', 'Tenders']],
  ['supplier discovery', ['Suppliers']],
  ['product catalog', ['Products']],
  ['order fulfillment', ['Orders']],
  ['tender', ['Tenders', 'Proposals']],
];

// Every admin gets these regardless of plan -- basic self-service account
// management, not a purchasable "module".
const ALWAYS_GRANTED_MODULES = ['Settings', 'Users'];

function mapModuleNames(wellongepayFeatureNames: string[], map: Array<[string, string[]]>): string[] {
  const resolved = new Set(ALWAYS_GRANTED_MODULES);
  for (const featureName of wellongepayFeatureNames) {
    const lower = featureName.toLowerCase();
    for (const [keyword, modules] of map) {
      if (lower.includes(keyword)) {
        modules.forEach((m) => resolved.add(m));
      }
    }
  }
  return Array.from(resolved);
}

export function mapToTaxComplianceModules(featureNames: string[]): string[] {
  return mapModuleNames(featureNames, TAX_COMPLIANCE_MODULE_MAP);
}

export function mapToSupplierPlatformModules(featureNames: string[]): string[] {
  return mapModuleNames(featureNames, SUPPLIER_PLATFORM_MODULE_MAP);
}

// ─── 1. Client User Management (clientmng) — always called ────────────────

const COMPLETE_ONBOARDING = `
  mutation CompleteOnboarding($data: CompleteOnboardingInput!) {
    completeOnboarding(data: $data) {
      success
      message
      clientId
      organizationId
    }
  }
`;

export interface ClientManagementInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // full number including country code
  country?: string;
  jobTitle?: string;
  orgName: string;
  industry?: string;
  orgSize?: string;
  billingPeriod: 'monthly' | 'yearly';
  userCount?: number;
  assetCount?: number;
  storageGb?: number;
  // Human-readable summary of what was actually purchased (category,
  // package, price, modules) -- clientmng's own ServiceCategory/Feature
  // catalog has different IDs than wellongepay's, so real entitlements
  // can't be mapped into selectedServiceIds/selectedFeatures below (left
  // empty on purpose); this is what makes the purchase visible to an
  // admin browsing this client in clientall.eopsprimax.com at all.
  purchaseSummary?: string;
  // Cross-system account references, so a future deleteClient in
  // clientmng can actually reach this person's other accounts instead of
  // only ever removing the local clientmng record. wellongeAccountId is
  // always available (Step 1 of registration); destinationSystem/
  // destinationUserId are only set when this registration also
  // provisioned a Tax Compliance/Buyer/Supplier account.
  wellongeAccountId?: string;
  destinationSystem?: 'tax_compliance' | 'buyer' | 'supplier';
  destinationUserId?: string;
}

// ─── Admin-drafted invitation (Client Management "finish registration") ───

const INVITATION_DETAILS_QUERY = `
  query InvitationDetails($token: String!) {
    invitationDetails(token: $token) {
      clientId
      firstName
      lastName
      primaryEmail
      name
      status
      currency
      categoryName
      packageName
      billingCycle
      subFeatureSelections { subFeatureId name price quantity }
      addonSelections { addonId name unitPrice quantity }
    }
  }
`;

// subFeatureId/addonId here are REAL wellongepay catalog IDs (the admin's
// picker in Client Management sources live from wellongepay's own public
// catalog -- see save_client_invitation_plan) -- they can be sent directly
// to registerCustomSubscription below with no translation step.
export interface InvitationDetails {
  clientId: number;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  name: string;
  status: string;
  currency: string;
  categoryName: string | null; // e.g. "Tax Compliance Agents" / "Buyer" / "Supplier" -- feeds resolveDestinationSystem
  packageName: string | null;
  billingCycle: string;
  subFeatureSelections: Array<{ subFeatureId: string; name: string; price: number; quantity: number }>;
  addonSelections: Array<{ addonId: string; name: string; unitPrice: number; quantity: number }>;
}

/**
 * Public, token-gated lookup for the client-facing finish-registration
 * page (pricingtmp's own /invite/[token]) — resolves an admin-drafted
 * Client (Client Management) by its one-time invitation token. Returns
 * null if the token is unknown, expired, or no plan has been configured
 * for it yet.
 */
export async function getInvitationDetails(token: string): Promise<InvitationDetails | null> {
  const data = await graphqlPost<{ invitationDetails: InvitationDetails | null }>(
    CLIENT_MGMT_GRAPHQL_URL,
    INVITATION_DETAILS_QUERY,
    { token }
  );
  return data.invitationDetails;
}

const FINALIZE_CLIENT_FROM_INVITATION = `
  mutation FinalizeClientFromInvitation($token: String!, $personalAccountId: String!, $subscriptionId: String) {
    finalizeClientFromInvitation(token: $token, personalAccountId: $personalAccountId, subscriptionId: $subscriptionId) {
      success
      message
      client { id status }
    }
  }
`;

/**
 * Flips the already-drafted Client (created by an admin via Client
 * Management) from 'draft' to 'active' once the invited client has
 * finished Wellonge ID registration + billing. Does NOT create new
 * Organization/selection rows — those already exist from the admin's
 * draft — this only links the real account and marks it complete.
 */
export async function finalizeClientFromInvitation(
  token: string,
  personalAccountId: string,
  subscriptionId?: string
): Promise<{ success: boolean; message: string }> {
  const data = await graphqlPost<{ finalizeClientFromInvitation: { success: boolean; message: string } }>(
    CLIENT_MGMT_GRAPHQL_URL,
    FINALIZE_CLIENT_FROM_INVITATION,
    { token, personalAccountId, subscriptionId }
  );
  return data.finalizeClientFromInvitation;
}

export async function registerWithClientManagement(input: ClientManagementInput) {
  const data = await graphqlPost<{ completeOnboarding: { success: boolean; message: string; clientId: number | null; organizationId: string | null } }>(
    CLIENT_MGMT_GRAPHQL_URL,
    COMPLETE_ONBOARDING,
    {
      data: {
        selectedServiceIds: [],
        selectedFeatures: [],
        selectedAddons: [],
        organizationType: 'standard',
        organizationCount: 1,
        resourceCounts: {
          userCount: input.userCount ?? 1,
          assetCount: input.assetCount ?? 0,
          storageGb: input.storageGb ?? 0,
        },
        clientInfo: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          country: input.country,
          jobTitle: input.jobTitle,
        },
        organizationInfo: {
          name: input.orgName,
          companySize: input.orgSize,
          industry: input.industry,
        },
        billingPeriod: input.billingPeriod,
        internalNotes: input.purchaseSummary,
        wellongeAccountId: input.wellongeAccountId,
        destinationSystem: input.destinationSystem,
        destinationUserId: input.destinationUserId,
      },
    }
  );
  return data.completeOnboarding;
}

// ─── 2a. Tax Compliance (backtaxcomply) ────────────────────────────────────

const REGISTER_FIRM = `
  mutation RegisterFirm($input: RegisterFirmInput!) {
    registerFirm(input: $input) {
      success
      message
      accessToken
      refreshToken
      user { id }
    }
  }
`;

export interface TaxComplianceInput {
  orgName: string;
  industry: string;
  orgSize: string;
  country: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  planName: string; // the wellongepay package the user just bought
  purchasedModules: string[]; // mapped via mapToTaxComplianceModules()
}

export async function registerWithTaxCompliance(input: TaxComplianceInput) {
  const data = await graphqlPost<{ registerFirm: { success: boolean; message: string; accessToken: string | null; refreshToken: string | null; user: { id: string } | null } }>(
    TAX_COMPLIANCE_GRAPHQL_URL,
    REGISTER_FIRM,
    {
      input: {
        firmName: input.orgName,
        industry: input.industry,
        size: input.orgSize,
        country: input.country,
        // Self-enrolled business (the end company itself), not an
        // accounting firm reselling to multiple clients.
        accountType: 'business',
        plan: input.planName,
        purchasedModules: input.purchasedModules,
        adminEmail: input.email,
        adminPassword: input.password,
        adminFirstName: input.firstName,
        adminLastName: input.lastName,
      },
    }
  );
  return data.registerFirm;
}

// ─── 2b. Buyer / Supplier (backsupplier) ───────────────────────────────────

const REGISTER_SUPPLIER_PLATFORM = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user { id }
    }
  }
`;

export interface SupplierPlatformInput {
  orgName: string;
  orgSlug: string; // used as the tenant domain -- must be reasonably unique
  country?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgType: 'buyer' | 'supplier';
  planName: string;
  purchasedModules: string[]; // mapped via mapToSupplierPlatformModules()
}

export async function registerWithSupplierPlatform(input: SupplierPlatformInput) {
  const data = await graphqlPost<{ register: { accessToken: string; refreshToken: string; user: { id: string } } }>(
    SUPPLIER_GRAPHQL_URL,
    REGISTER_SUPPLIER_PLATFORM,
    {
      input: {
        companyName: input.orgName,
        domain: input.orgSlug,
        country: input.country,
        orgType: input.orgType,
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        plan: input.planName,
        purchasedModules: input.purchasedModules,
      },
    }
  );
  return data.register;
}
