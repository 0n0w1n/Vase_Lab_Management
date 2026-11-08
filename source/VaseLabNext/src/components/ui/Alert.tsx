"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "cn";

export type AlertKind = "success" | "error" | "info";

type AlertItem = { id: number; kind: AlertKind; text: string };

type ShowAlert = (kind: AlertKind, text: string) => void;

const AlertContext = createContext<ShowAlert>(() => {});

/** How long an alert stays on screen, in ms. */
const LIFETIME = 3500;

const kindStyles: Record<AlertKind, string> = {
  success: "bg-green-100 text-green-800 ring-green-300",
  error: "bg-red-100 text-red-800 ring-red-300",
  info: "bg-blue-100 text-blue-800 ring-blue-300",
};

let nextId = 0;

/** Wrap the app once; any component below can then call useAlert(). */
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const showAlert = useCallback<ShowAlert>((kind, text) => {
    const id = nextId++;
    setAlerts((list) => [...list, { id, kind, text }]);
    setTimeout(() => {
      setAlerts((list) => list.filter((n) => n.id !== id));
    }, LIFETIME);
  }, []);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}

      {/* Above the modals (z-50) so an alert shows even while one is open */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-60 flex flex-col items-end gap-2"
      >
        {alerts.map((n) => (
          <p
            key={n.id}
            role={n.kind === "error" ? "alert" : "status"}
            className={cn("rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md ring-1", kindStyles[n.kind])}
          >
            {n.text}
          </p>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

/** showAlert("success", "Saved") shows a coloured message that disappears by itself. */
export function useAlert() {
  return useContext(AlertContext);
}
