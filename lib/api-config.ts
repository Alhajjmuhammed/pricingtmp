/**
 * API Configuration for Pricingtmp
 *
 * The pricing/customize/registration pages run fully unauthenticated (no
 * logged-in admin, no Bearer token) -- they're a public storefront. The
 * billing backend's normal tenant-resolution auth gate requires a Bearer
 * token, so this site instead calls a small set of deliberately-public
 * resolvers (see billing/subscriptions/queries/public_queries.py and
 * mutations/public_mutations.py) that take an explicit tenantId argument.
 * BILLING_TENANT_ID identifies which platform's catalog/pricing to show --
 * there's currently only one tenant (wellongepay/haminass).
 */

// Billing (Wellongepay) GraphQL backend -- pricing, catalog, subscriptions
export const BILLING_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_BILLING_GRAPHQL_URL ||
  'https://backwellongepay.eopsprimax.com/graphql/';

// The tenant whose catalog/pricing this storefront shows
export const BILLING_TENANT_ID =
  process.env.NEXT_PUBLIC_BILLING_TENANT_ID ||
  '05cf2f3e-eef4-400e-9a4d-a4e74421fb0e';

/**
 * Helper function to get the billing GraphQL endpoint
 */
export function getBillingGraphQLEndpoint(): string {
  return BILLING_GRAPHQL_URL;
}
