const DEFAULT_API_BASE_URL = "http://localhost:8000";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "mediease:accessToken";
const REFRESH_TOKEN_KEY = "mediease:refreshToken";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  metadata?: Record<string, unknown>;
  errors?: unknown;
}

interface ApiRequestOptions extends RequestInit {
  auth?: boolean;
  parseJson?: boolean;
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken?: string;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseResponse<T>(response: Response, parseJson: boolean) {
  if (!parseJson) {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return null as T;
  }

  let payload: ApiResponse<T> | undefined;
  try {
    payload = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return undefined;
  }

  if (!response.ok) {
    const errorMessage =
      payload?.message ||
      (payload?.errors as string) ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload;
}

export async function apiRequest<T = unknown>(
  path: string,
  { auth = true, parseJson = true, headers, ...options }: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const requestHeaders = new Headers({
    Accept: "application/json",
    ...headers,
  });

  if (!(options.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getStoredAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: requestHeaders,
  });

  return (await parseResponse<T>(response, parseJson)) ?? {
    success: response.ok,
  };
}

export async function get<T = unknown>(path: string, options?: ApiRequestOptions) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export async function post<T = unknown>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
) {
  return apiRequest<T>(path, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function put<T = unknown>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
) {
  return apiRequest<T>(path, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function patch<T = unknown>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
) {
  return apiRequest<T>(path, {
    ...options,
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function del<T = unknown>(path: string, options?: ApiRequestOptions) {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}

export const apiClient = {
  request: apiRequest,
  get,
  post,
  put,
  patch,
  delete: del,
  storeTokens,
  clearTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
};

export type { ApiRequestOptions };

