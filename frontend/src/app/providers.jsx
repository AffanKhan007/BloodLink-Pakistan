"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "../auth/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import I18nProvider from "./I18nProvider";

export default function AppProviders({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ToastProvider>
      <AuthProvider>
        <I18nProvider>{children}</I18nProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
