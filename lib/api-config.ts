/**
 * API Configuration for Pricingtmp
 * Connects to both Wellongepay (Port 8000) and Client Management (Port 8001) backends
 */

// Wellongepay Billing Backend (Port 8000) - For main pricing page
export const PRICING_GRAPHQL_URL = 
  process.env.NEXT_PUBLIC_PRICING_GRAPHQL_URL || 
  'http://localhost:8000/graphql/';

// Client Management Backend (Port 8001) - For customize page
export const GRAPHQL_BASE_URL = 
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 
  'http://localhost:8001/graphql/';

/**
 * Helper function to get GraphQL endpoint
 * @returns GraphQL endpoint URL
 */
export function getGraphQLEndpoint(): string {
  return GRAPHQL_BASE_URL;
}

/**
 * Helper function to get pricing GraphQL endpoint
 * @returns Pricing GraphQL endpoint URL
 */
export function getPricingGraphQLEndpoint(): string {
  return PRICING_GRAPHQL_URL;
}
