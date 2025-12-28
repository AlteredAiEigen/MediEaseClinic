const resolveDefaultApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const { protocol, hostname, host } = window.location;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }

    return `${protocol}//${host}`;
  }

  return "http://localhost:8000";
};

const DEFAULT_API_BASE_URL = resolveDefaultApiBaseUrl();

const apiBase = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const API_BASE_URL = apiBase.replace(/\/$/, "");

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

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const payload = await parseResponse<{
      accessToken?: string;
      refreshToken?: string;
    }>(refreshResponse, true);

    const newAccessToken = payload?.data?.accessToken;
    if (payload?.success && newAccessToken) {
      storeTokens({
        accessToken: newAccessToken,
        refreshToken: payload.data?.refreshToken ?? refreshToken,
      });
      return newAccessToken;
    }
  } catch {
    // fall through to clearing tokens below
  }

  clearTokens();
  return null;
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
    const backendDetail = (() => {
      const detail = (payload as any)?.detail;
      if (!detail) return undefined;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((item) => {
            if (!item) return "";
            if (typeof item === "string") return item;
            if (typeof item === "object" && "msg" in item) {
              return (item as { msg?: string }).msg ?? "";
            }
            return JSON.stringify(item);
          })
          .filter(Boolean)
          .join(", ");
      }
      if (typeof detail === "object") {
        if ("msg" in detail && typeof detail.msg === "string") {
          return detail.msg;
        }
        if ("message" in detail && typeof detail.message === "string") {
          return detail.message;
        }
        return JSON.stringify(detail);
      }
      return String(detail);
    })();

    const errorMessage =
      payload?.message ||
      backendDetail ||
      (typeof payload?.errors === "string"
        ? payload.errors
        : undefined) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage) as Error & { 
      status?: number;
      response?: Response;
      data?: any;
    };
    error.status = response.status;
    error.response = response;
    error.data = payload; // Attach the full response payload
    throw error;
  }

  return payload;
}

export async function apiRequest<T = unknown>(
  path: string,
  { auth = true, parseJson = true, headers, ...options }: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const executeRequest = async (accessTokenOverride?: string) => {
    const requestHeaders = new Headers({
      Accept: "application/json",
      ...headers,
    });

    if (!(options.body instanceof FormData)) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (auth) {
      const token = accessTokenOverride ?? getStoredAccessToken();
      if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
      }
    }

    return fetch(url, {
      ...options,
      headers: requestHeaders,
    });
  };

  let response = await executeRequest();

  if (auth && response.status === 401) {
    const newAccessToken = await attemptTokenRefresh();
    if (newAccessToken) {
      response = await executeRequest(newAccessToken);
    }
  }

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

