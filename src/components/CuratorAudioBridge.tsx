"use client";

import { useEffect, useRef } from "react";
import { BroadcastAudioManager } from "@/lib/broadcastAudioManager";

/**
 * Invisible audio bridge: starts broadcast sync on initial touch/click anywhere
 * without rendering any visible UI bars or icons.
 */
export function CuratorAudioBridge() {
  const started = useRef(false);

  useEffect(() => {
    const manager = BroadcastAudioManager.getInstance();
    manager.syncToBroadcast(false);

    const unlock = () => {
      if (!started.current) {
        started.current = true;
        manager.start();
      }
    };

    window.addEventListener("click", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
