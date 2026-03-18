/**
 * GraphQL Client for Pricingtmp
 * Connects to Django Backend (Port 8001)
 */

import { GRAPHQL_BASE_URL } from './api-config';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Generic GraphQL request function
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @returns Query result
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(GRAPHQL_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: 'no-store', // Prevent caching
  });

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors) {
    throw new Error(result.errors.map(e => e.message).join(', '));
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL');
  }

  return result.data;
}

// ============ GRAPHQL QUERIES ============

export const GET_SERVICE_CATEGORIES = `
  query GetServiceCategories {
    serviceCategories {
      id
      name
      slug
      description
      icon
      iconUrl
      color
      isActive
      sortOrder
      createdAt
      updatedAt
      features {
        id
        name
        slug
        description
        icon
        iconUrl
        price
        pricingUnit
        isActive
        subFeatures {
          id
          name
          slug
          description
          icon
          iconUrl
          price
          currency
          isActive
          isDefaultEnabled
        }
      }
      addons {
        id
        name
        slug
        description
        icon
        iconUrl
        price
        pricingPeriod
        isActive
      }
    }
  }
`;

// ============ TYPE DEFINITIONS ============

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  iconUrl?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  features?: Feature[];
  addons?: AddOn[];
}

export interface Feature {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  iconUrl?: string;
  price: number;
  pricingUnit: string;
  isActive: boolean;
  subFeatures?: SubFeature[];
}

export interface SubFeature {
  id: number;
  featureId: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  iconUrl?: string;
  price: number;
  currency: string;
  isActive: boolean;
  isDefaultEnabled: boolean;
}

export interface AddOn {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  iconUrl?: string;
  price: number;
  pricingPeriod: string;
  isActive: boolean;
}
