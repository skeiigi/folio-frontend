import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, tokenStore, ApiError } from "./api";
import type { User, Role } from "./types";

interface AuthResponse {
  user: User;
  token: string;
  profileId: string | null;
}
interface AuthState {
  user: User | null;
  profileId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "client" | "author",
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  becomeAuthor: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());
  const query = useQueryClient();
  function clear() {
    tokenStore.clear();
    setUser(null);
    setProfileId(null);
    query.clear();
  }
  async function refresh() {
    if (!tokenStore.get()) return;
    try {
      const data = await api<{ user: User; profileId: string | null }>(
        "/auth/me",
      );
      setUser(data.user);
      setProfileId(data.profileId);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) clear();
      throw e;
    }
  }
  useEffect(() => {
    if (tokenStore.get())
      refresh()
        .catch(() => {})
        .finally(() => setLoading(false));
    const handler = () => clear();
    window.addEventListener("folio:unauthorized", handler);
    return () => window.removeEventListener("folio:unauthorized", handler);
  }, []);
  async function authenticate(path: string, json: unknown) {
    const data = await api<AuthResponse>(path, { method: "POST", json });
    query.clear();
    tokenStore.set(data.token);
    setUser(data.user);
    setProfileId(data.profileId);
    return data;
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        profileId,
        loading,
        refresh,
        login: (email, password) =>
          authenticate("/auth/login", { email, password }),
        register: (name, email, password, role) =>
          authenticate("/auth/register", { name, email, password, role }),
        logout: async () => {
          try {
            await api("/auth/logout", { method: "POST" });
          } catch {
            /* Always clear this browser session. */
          } finally {
            clear();
          }
        },
        becomeAuthor: async () => {
          const data = await api<{ user: User }>("/auth/become-author", {
            method: "POST",
          });
          setUser(data.user);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const state = useContext(AuthContext);
  if (!state) throw new Error("Auth provider missing");
  return state;
};
export function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  role?: Role;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return <div className="page-loading">Открываем ваше пространство…</div>;
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (role && !user.roles.includes(role) && !user.roles.includes("admin"))
    return <Navigate to={role === "author" ? "/become-author" : "/"} replace />;
  return <>{children}</>;
}
