"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface MobileContextType {
  isMobile: boolean;
}

const MOBILE_BREAKPOINT = 768;

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({
  children,
  serverState,
}: {
  children: ReactNode;
  serverState: boolean;
}) {
  const [isMobile, setIsMobile] = useState(serverState);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return <MobileContext value={{ isMobile }}>{children}</MobileContext>;
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error("useMobile must be used within a MobileProvider");
  }
  return context;
}
