"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** How often to re-fetch the page's server data, in milliseconds. */
  intervalMs?: number;
};

/**
 * Keeps a server-rendered page in sync with changes made by other users.
 *
 * Calls router.refresh() on a timer, which re-runs the page's server
 * components and fetches without losing client state (open modals, typed
 * text, scroll position). Pauses while the tab is hidden so idle tabs
 * don't hit the API, and refreshes right away when the tab is shown again.
 *
 * Renders nothing; drop it into any page or layout that should stay live.
 */
export default function AutoRefresh({ intervalMs = 10_000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (timer === undefined) timer = setInterval(() => router.refresh(), intervalMs);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router, intervalMs]);

  return null;
}
