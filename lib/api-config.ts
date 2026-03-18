/**
 * API Configuration for Pricingtmp
 * Connects to eOps Client Management GraphQL Backend
 */

// Client Management Backend (Port 8001) - Your Django GraphQL Backend
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
