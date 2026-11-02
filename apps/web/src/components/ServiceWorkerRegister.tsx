"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // eslint-disable-next-line no-console
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch(() => {
          // Non-blocking
        });
    }
  }, []);

  return null;
}
