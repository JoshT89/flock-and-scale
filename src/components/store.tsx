"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData } from "@/lib/types";
import { STORAGE_KEY } from "@/lib/utils";
import { demoData } from "@/lib/seed";
import { dataSchema } from "@/lib/schema";

type Store = {
  data: AppData;
  ready: boolean;
  error: string;
  update: (fn: (d: AppData) => AppData) => boolean;
  replace: (d: AppData) => boolean;
  toast: (message: string) => void;
};
const Context = createContext<Store | null>(null);
export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => demoData());
  const ref = useRef(data);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = useCallback((message: string) => {
    setMessage(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 4000);
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = dataSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) throw new Error("Invalid records");
        ref.current = parsed.data;
        setData(parsed.data);
      }
    } catch {
      setError(
        "Your saved records could not be opened. Export the stored backup in Settings before starting a new collection.",
      );
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      try {
        if (!event.newValue) {
          setError(
            "Records were removed in another tab. Reload before making changes.",
          );
          return;
        }
        const next = dataSchema.parse(JSON.parse(event.newValue));
        ref.current = next;
        setData(next);
      } catch {
        setError("Another tab changed your records to an unreadable format.");
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      clearTimeout(timer.current);
    };
  }, []);
  const replace = useCallback(
    (next: AppData) => {
      const parsed = dataSchema.safeParse(next);
      if (!parsed.success) {
        toast(parsed.error.issues[0]?.message ?? "Please check the record.");
        return false;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
        ref.current = parsed.data;
        setData(parsed.data);
        setError("");
        return true;
      } catch {
        setError(
          "Device storage is unavailable or full. Your change was not saved. Export a backup and free some space.",
        );
        return false;
      }
    },
    [toast],
  );
  const update = useCallback(
    (fn: (d: AppData) => AppData) => {
      if (error) {
        toast("Resolve the storage error in Settings before saving.");
        return false;
      }
      return replace(fn(ref.current));
    },
    [replace, error, toast],
  );
  return (
    <Context.Provider value={{ data, ready, error, update, replace, toast }}>
      {children}
      <div
        className={`toast ${message ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </Context.Provider>
  );
}
export function useData() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing DataProvider");
  return context;
}
