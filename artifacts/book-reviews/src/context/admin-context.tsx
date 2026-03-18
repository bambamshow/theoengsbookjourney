import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "admin_token";

interface AdminContextValue {
  isAdmin: boolean;
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try { return sessionStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  const login = useCallback(async (password: string): Promise<boolean> => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      try { sessionStorage.setItem(STORAGE_KEY, password); } catch {}
      setToken(password);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    setToken(null);
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin: !!token, token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
