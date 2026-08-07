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
