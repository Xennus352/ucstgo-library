"use client";

import { useEffect } from "react";
import { subscribeUser } from "@/hooks/usePushNotifications";

export default function PushInit() {
  useEffect(() => {
    subscribeUser();
  }, []);

  return null;
}
