import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../api/client";

const STORAGE_KEY = "bloodlink_auth";
const AuthContext = createContext(null);

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredAuth().token);
  const [user, setUser] = useState(() => readStoredAuth().user);
  const [isLoading, setIsLoading] = useState(Boolean(readStoredAuth().token));

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    apiRequest("/auth/me", { token })
      .then((currentUser) => {
        if (!isMounted) return;
        setUser(currentUser);
      })
      .catch(() => {
        if (!isMounted) return;
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const persistAuth = (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: authToken, user: authUser }));
  };

  const login = async (credentials) => {
    const data = await apiRequest("/auth/login", { method: "POST", body: credentials });
    persistAuth(data.access_token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await apiRequest("/auth/register", { method: "POST", body: payload });
    persistAuth(data.access_token, data.user);
    return data.user;
  };

  const refreshUser = async () => {
    if (!token) return null;
    const currentUser = await apiRequest("/auth/me", { token });
    setUser(currentUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: currentUser }));
    return currentUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ token, user, isLoading, isAuthenticated: Boolean(token), login, register, logout, refreshUser }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

