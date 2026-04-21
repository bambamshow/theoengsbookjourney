import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const TOKEN_KEY = "admin_token";
const ENTRY_KEY = "entry_seen";

interface AdminContextValue {
  isAdmin: boolean;
  token: string | null;
  showEntry: boolean;
  dismissEntry: () => void;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
  });

  const [showEntry, setShowEntry] = useState<boolean>(() => {
    try {
      const alreadyLoggedIn = !!sessionStorage.getItem(TOKEN_KEY);
      const alreadySeen = !!sessionStorage.getItem(ENTRY_KEY);
      return !alreadyLoggedIn && !alreadySeen;
    } catch { return true; }
  });

  const dismissEntry = useCallback(() => {
    try { sessionStorage.setItem(ENTRY_KEY, "1"); } catch {}
    setShowEntry(false);
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      try {
        sessionStorage.setItem(TOKEN_KEY, password);
        sessionStorage.setItem(ENTRY_KEY, "1");
      } catch {}
      setToken(password);
      setShowEntry(false);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ENTRY_KEY);
    } catch {}
    setToken(null);
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin: !!token, token, showEntry, dismissEntry, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
