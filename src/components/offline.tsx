"use client";
import { useEffect } from "react";
export function OfflineSupport() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          const urls = performance
            .getEntriesByType("resource")
            .map((r) => r.name)
            .filter((url) =>
              url.startsWith(`${location.origin}/_next/static/`),
            );
          registration.active?.postMessage({ type: "CACHE_RESOURCES", urls });
        })
        .catch(() => {
          /* Online app remains available when browser registration is restricted. */
        });
    }
  }, []);
  return null;
}
