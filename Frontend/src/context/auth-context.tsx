import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { post, get, clearTokens, storeTokens } from "@/lib/api-client";

export type UserRole = "admin" | "doctor" | "receptionist";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  profileImage?: string | null;
  speciality?: string | null;
  licenseNumber?: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  clinicName?: string;
  speciality?: string;
  licenseNumber?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    initialized: false,
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await get<{ user: User }>("/api/auth/me");
      if (response.success && response.data?.user) {
        setState((prev) => ({
          ...prev,
          user: response.data?.user ?? null,
          initialized: true,
        }));
      } else {
        setState((prev) => ({ ...prev, user: null, initialized: true }));
      }
    } catch {
      clearTokens();
      setState((prev) => ({ ...prev, user: null, initialized: true }));
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

    const login = useCallback(async ({ email, password }: LoginPayload) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        // Call the real backend API
        const response = await post<{
          user: User;
          accessToken: string;
          refreshToken?: string;
        }>("/api/auth/login", {
          email,
          password,
        }, { auth: false });

      if (!(response.success && response.data?.user && response.data.accessToken)) {
        throw new Error(response.message ?? "Login failed");
      }

      storeTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });

      setState({
        user: response.data.user,
        loading: false,
        initialized: true,
      });

      return response.data.user;
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      clearTokens();
      throw error;
    }
  }, []);

  const register = useCallback(
    async ({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      clinicName,
      speciality,
      licenseNumber,
    }: RegisterPayload) => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const payload = {
          email,
          password,
          firstName,
          lastName,
          phone,
          role,
          clinicName,
          speciality,
          licenseNumber,
        };

        const response = await post<{
          user: User;
          accessToken: string;
          refreshToken?: string;
        }>("/api/auth/register", payload, { auth: false });

        if (!(response.success && response.data?.user && response.data.accessToken)) {
          throw new Error(response.message ?? "Registration failed");
        }

        storeTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });

        setState({
          user: response.data.user,
          loading: false,
          initialized: true,
        });

        return response.data.user;
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false }));
        clearTokens();
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, loading: false, initialized: true });
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      loading: state.loading,
      initialized: state.initialized,
      login,
      register,
      logout,
      refreshUser,
    }),
    [state, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

