"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getBrandConfig, BrandConfig } from "@/app/actions/get-brand";

interface BrandConfigContextValue {
  config: BrandConfig;
  refresh: () => Promise<void>;
}

const defaultConfig: BrandConfig = {
  name: "UCSTGO Library",
  logo: "/images/brand.png",
  favicon: "/icon.png",
  title: "UCSTGO Digital Library",
  updatedAt: "",
};

const BrandConfigContext = createContext<BrandConfigContextValue>({
  config: defaultConfig,
  refresh: async () => {},
});

export function BrandConfigProvider({
  children,
  initialConfig,
}: {
  children: React.ReactNode;
  initialConfig?: BrandConfig;
}) {
  const [config, setConfig] = useState<BrandConfig>(
    initialConfig ?? defaultConfig,
  );

  const refresh = useCallback(async () => {
    const fresh = await getBrandConfig();
    setConfig(fresh);
  }, []);

  useEffect(() => {
    if (!initialConfig) {
      refresh();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrandConfigContext.Provider value={{ config, refresh }}>
      {children}
    </BrandConfigContext.Provider>
  );
}

export function useBrandConfig() {
  return useContext(BrandConfigContext);
}
