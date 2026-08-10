"use client";

import { useEffect, useState } from "react";

export default function I18nProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let instance = null;
    let cancelled = false;
    const syncDocumentLanguage = () => {
      if (!instance) return;
      const lang = instance.language;
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    };
    const load = async () => {
      const mod = await import("../i18n");
      if (cancelled) return;
      instance = mod.default;
      syncDocumentLanguage();
      instance.on("languageChanged", syncDocumentLanguage);
      setReady(true);
    };
    load();
    return () => {
      cancelled = true;
      if (instance) instance.off("languageChanged", syncDocumentLanguage);
    };
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
