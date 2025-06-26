"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";

export function Hydration() {
  useEffect(() => {
    // Manually rehydrate the settings store
    useSettingsStore.persist.rehydrate();
  }, []);

  return null;
}
