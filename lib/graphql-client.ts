/**
 * GraphQL Client for Pricingtmp
 * Talks to the Wellongepay billing backend's public, unauthenticated
 * resolvers (see lib/api-config.ts for why this needs an explicit
 * tenantId rather than a Bearer token).
 */

import { BILLING_GRAPHQL_URL, BILLING_TENANT_ID } from './api-config';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Generic GraphQL request function against the billing backend's public
 * API. tenantId is injected into variables automatically unless already
 * provided by the caller.
 */
export async function billingGraphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(BILLING_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { tenantId: BILLING_TENANT_ID, ...variables },
    }),
    cache: 'no-store',
  });

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors) {
    throw new Error(result.errors.map(e => e.message).join(', '));
  }

  if (!result.data) {
    throw new Error('No data returned from billing API');
  }

  return result.data;
}

// ============ GRAPHQL QUERIES ============

// Flat package list for the "Compare plans in detail" modal. planId
// scopes this to one business-line category (Buyer / Tax Compliance /
// Supplier) -- without it, every category's same-named tiers (each has
// its own Starter/Professional/Enterprise) come back side by side as if
// they were price variants of a single plan.
export const GET_PRICING_PLANS = `
  query GetPricingPlans($tenantId: ID!, $planId: ID) {
    publicPricingPackages(tenantId: $tenantId, planId: $planId) {
      id
      name
      tagline
      monthlyPrice
      annualPrice
      badge
      highlighted
      features
      previousPlan
      cta
      ctaVariant
      freeTierLimit
    }
  }
`

// Business-line categories (e.g. Tax Compliance, Buyer, Supplier) with
// their pricing packages nested underneath. Dynamic -- whatever Plans an
// admin has created and activated for this tenant show up here; a Plan
// with no packages yet still appears (empty `packages`), so the storefront
// can render it as "coming soon" instead of hiding it.
export const GET_PUBLIC_PLANS = `
  query GetPublicPlans($tenantId: ID!) {
    publicPlans(tenantId: $tenantId) {
      id
      name
      description
      packages {
        id
        planId
        planName
        name
        tagline
        monthlyPrice
        annualPrice
        badge
        highlighted
        features
        moduleNames
        previousPlan
        cta
        ctaVariant
        freeTierLimit
      }
    }
  }
`;

export interface PublicPlan {
  id: string;
  name: string;
  description: string;
  packages: import('./pricing-data').Plan[];
}

// Same category scoping as GET_PRICING_PLANS -- see comment above.
export const GET_FEATURE_COMPARISON = `
  query GetFeatureComparison($tenantId: ID!, $planId: ID) {
    publicFeatureComparison(tenantId: $tenantId, planId: $planId) {
      id
      name
      features {
        id
        name
        tooltip
        values {
          packageId
          packageName
          valueType
          valueJson
        }
      }
    }
  }
`;

// Full catalog (Feature -> SubFeatures/Addons) for the "build your own
// plan" customize page. A SubFeature/Addon shared across Features (see
// SubFeature.features / Addon.features on the backend) appears once per
// Feature it belongs to.
export const GET_PUBLIC_CATALOG = `
  query GetPublicCatalog($tenantId: ID!, $planId: ID) {
    publicCatalog(tenantId: $tenantId, planId: $planId) {
      id
      name
      key
      description
      sortOrder
      subFeatures {
        id
        name
        description
        price
        billingType
      }
      addons {
        id
        name
        description
        unitPrice
        billingType
        maxQuantity
      }
    }
  }
`;

// ============ TYPE DEFINITIONS ============

export interface PublicSubFeature {
  id: string;
  name: string;
  description: string;
  price: number;
  billingType: string;
}

export interface PublicAddon {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  billingType: string;
  maxQuantity: number | null;
}

export interface PublicFeature {
  id: string;
  name: string;
  key: string;
  description: string;
  sortOrder: number;
  subFeatures: PublicSubFeature[];
  addons: PublicAddon[];
}

// ============ SUBSCRIPTION CREATION ============

// Subscribe to a pre-built Package (the "Start free trial" flow).
// Called once, right after Wellonge ID registration + payment succeed.
// promoCode is optional -- the backend only honors it on ANNUAL billing
// (PromoCode's fixed rule) and re-validates it server-side regardless of
// what validatePromoCode already said client-side.
export const REGISTER_SUBSCRIPTION = `
  mutation RegisterSubscription($tenantId: ID!, $packageId: ID!, $ownerWalletId: ID, $billingCycle: String!, $promoCode: String) {
    registerSubscription(
      tenantId: $tenantId
      packageId: $packageId
      ownerWalletId: $ownerWalletId
      billingCycle: $billingCycle
      promoCode: $promoCode
    ) {
      subscriptionId
      packageId
      packageName
      status
      monthlyTotal
      annualTotal
      startDate
    }
  }
`;

// Checks a promo code against one package + billing cycle without
// consuming a use -- PromoCode is annual-only by fixed rule, so this is
// only meaningful when the caller has selected annual billing.
export const VALIDATE_PROMO_CODE = `
  query ValidatePromoCode($tenantId: ID!, $code: String!, $packageId: ID!, $billingCycle: String!) {
    validatePromoCode(tenantId: $tenantId, code: $code, packageId: $packageId, billingCycle: $billingCycle) {
      valid
      message
      discountPercentage
      disablesFreeTrial
      effectiveAnnualPrice
      currency
    }
  }
`;

export interface PromoCodeValidationResult {
  valid: boolean;
  message: string;
  discountPercentage: number;
  disablesFreeTrial: boolean;
  effectiveAnnualPrice: number;
  currency: string;
}

// "Build your own plan" flow: instantiates a new Package with exactly the
// picked Sub-Features/Add-ons enabled, then subscribes to it.
export const REGISTER_CUSTOM_SUBSCRIPTION = `
  mutation RegisterCustomSubscription(
    $tenantId: ID!
    $packageName: String!
    $subFeatureSelections: [PublicSubFeatureSelectionInput!]!
    $addonSelections: [PublicAddonSelectionInput!]!
    $ownerWalletId: ID
    $billingCycle: String!
  ) {
    registerCustomSubscription(
      tenantId: $tenantId
      packageName: $packageName
      subFeatureSelections: $subFeatureSelections
      addonSelections: $addonSelections
      ownerWalletId: $ownerWalletId
      billingCycle: $billingCycle
    ) {
      subscriptionId
      packageId
      packageName
      status
      monthlyTotal
      annualTotal
      startDate
    }
  }
`;

export interface RegisterSubscriptionResult {
  registerSubscription: {
    subscriptionId: string;
    packageId: string;
    packageName: string;
    status: string;
    monthlyTotal: number;
    annualTotal: number;
    startDate: string;
  };
}

export interface RegisterCustomSubscriptionResult {
  registerCustomSubscription: RegisterSubscriptionResult['registerSubscription'];
}
