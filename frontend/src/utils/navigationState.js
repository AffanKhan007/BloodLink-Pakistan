"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const stateMap = new Map();

export function storeNavigationState(path, state) {
  stateMap.set(path, state);
}

export function useNavigationState() {
  const pathname = usePathname();
  const [state] = useState(() => {
    const stored = stateMap.get(pathname) || null;
    stateMap.delete(pathname);
    return stored;
  });
  return state;
}
