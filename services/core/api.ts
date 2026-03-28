/**
 * API Configuration and Base Service
 * Copied from FRT_eOpsEntre_Platform for pricingtmp integration
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Backend Base URLs
// - WELLONGE_ID: Primary backend at apitestweb.eopsentre.com (auth, accounts, organizations)
// - EOPSENTRE/WELLONGEPAY: Client Management backend (port 8001, plans, pricing, clients)
export const BACKEND_URLS = {
  WELLONGE_ID: {
    BASE_URL: process.env.NEXT_PUBLIC_REST_API_URL || 'https://apitestweb.eopsentre.com',
    REST_API: process.env.NEXT_PUBLIC_REST_API_URL || 'https://apitestweb.eopsentre.com',
  },
  WELLONGEPAY: {
    BASE_URL: process.env.NEXT_PUBLIC_CLIENT_MGMT_URL || 'http://localhost:8001',
    REST_API: (process.env.NEXT_PUBLIC_CLIENT_MGMT_URL || 'http://localhost:8001') + '/api',
  },
  EOPSENTRE: {
    BASE_URL: process.env.NEXT_PUBLIC_CLIENT_MGMT_URL || 'http://localhost:8001',
    REST_API: (process.env.NEXT_PUBLIC_CLIENT_MGMT_URL || 'http://localhost:8001') + '/api',
    GRAPHQL: (process.env.NEXT_PUBLIC_CLIENT_MGMT_URL || 'http://localhost:8001') + '/graphql',
  },
};

const API_CONFIG = {
  BASE_URL: BACKEND_URLS.EOPSENTRE.REST_API,
  TIMEOUT: 15000,
};

const getHeaders = (method: string) => {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

const API_DEBUG = true;

class BaseApiService {
  private baseUrl: string;
  private timeout: number;
  private useDefaultHeaders: boolean;

  constructor(
    baseUrl: string = API_CONFIG.BASE_URL,
    timeout: number = API_CONFIG.TIMEOUT,
    useDefaultHeaders: boolean = true
  ) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.timeout = timeout;
    this.useDefaultHeaders = useDefaultHeaders;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const method = options.method || 'GET';
    const finalHeaders = {
      ...(this.useDefaultHeaders ? getHeaders(method) : {}),
      ...(options.headers as Record<string, string> || {})
    };

    try {
      if (API_DEBUG) {
        console.log(`📡 [API Request] ${method} -> ${url}`);
      }

      const isFormData = options.body instanceof FormData;
      if (isFormData) {
        delete finalHeaders['Content-Type'];
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: finalHeaders,
      });
      clearTimeout(timeoutId);

      if (API_DEBUG && response) {
        console.log(`✅ [API Response] ${response.status} from ${url}`);
      }
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (API_DEBUG) {
        console.error(`💥 [API Error] ${method} ${url}:`, error.message);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${this.baseUrl}${normalizedEndpoint}`;
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
        }
        return { success: true, data: text as any };
      }

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `HTTP error! status: ${response.status}`;
        return {
          success: false,
          message: errorMessage,
          errors: [errorMessage],
          data: data,
        };
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      };
    }
  }

  async post<T>(endpoint: string, data: any, options: Partial<RequestInit> = {}): Promise<ApiResponse<T>> {
    try {
      const isFormData = data instanceof FormData;
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
        ...options,
      });

      let result;
      const rawText = await response.text(); // read once
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${rawText || response.statusText}`);
      }

      if (!response.ok) {
        const errorMessage = result?.error?.message || result?.message || `HTTP error! status: ${response.status}`;
        return {
          success: false,
          message: errorMessage,
          errors: [errorMessage],
          data: result,
        };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

// Service instances
export const baseApiService = new BaseApiService();
export const wellongeIdApiService = new BaseApiService(BACKEND_URLS.WELLONGE_ID.REST_API);
export const wellongepayApiService = new BaseApiService(BACKEND_URLS.WELLONGEPAY.REST_API);
// Local OTP service - uses local backend (port 8001) for email verification during development
export const localOtpApiService = new BaseApiService(BACKEND_URLS.EOPSENTRE.BASE_URL);

export default BaseApiService;
