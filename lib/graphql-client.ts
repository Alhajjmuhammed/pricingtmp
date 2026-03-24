/**
 * GraphQL Client for Pricingtmp
 * Connects to  Django Backends:
 * - Port 8000 (Wellongepay) for main pricing
 * - Port 8001 (Client Management) for customize page
 */

import { GRAPHQL_BASE_URL, PRICING_GRAPHQL_URL } from './api-config';

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

/**
 * GraphQL request function for pricing backend (Port 8000)
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @returns Query result
 */
export async function pricingGraphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(PRICING_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': '9cde3604-bbf8-4f97-ba54-dcc713229d6f', // Tenant ID for pricing
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

// Pricing Plans Query (Port 8000)
export const GET_PRICING_PLANS = `
  query GetPricingPlans {
    pricingPagePackages {
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
    }
  }
`

export const GET_FEATURE_COMPARISON = `
  query GetFeatureComparison {
    featureComparison {
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
