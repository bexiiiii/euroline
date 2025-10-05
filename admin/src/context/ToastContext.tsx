"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastRecord extends Required<Pick<ToastOptions, "message">> {
  id: string;
  title?: string;
  variant: ToastVariant;
}

interface ToastApi {
  show: (toast: ToastOptions) => void;
  dismiss: (id: string) => void;
  success: (message: string, options?: Omit<ToastOptions, "message" | "variant">) => void;
  error: (message: string, options?: Omit<ToastOptions, "message" | "variant">) => void;
  info: (message: string, options?: Omit<ToastOptions, "message" | "variant">) => void;
  warning: (message: string, options?: Omit<ToastOptions, "message" | "variant">) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const DEFAULT_DURATION = 4000;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    },
    [clearTimer]
  );

  const scheduleRemoval = useCallback(
    (id: string, duration: number) => {
      clearTimer(id);
      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      timers.current.set(id, timer);
    },
    [clearTimer, dismiss]
  );

  const show = useCallback(
    ({ id, title, message, variant = "info", duration = DEFAULT_DURATION }: ToastOptions) => {
      const toastId = id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id: toastId, title, message, variant }]);
      scheduleRemoval(toastId, duration);
    },
    [scheduleRemoval]
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (message, options) => show({ ...options, message, variant: "success" }),
      error: (message, options) => show({ ...options, message, variant: "error" }),
      info: (message, options) => show({ ...options, message, variant: "info" }),
      warning: (message, options) => show({ ...options, message, variant: "warning" }),
    }),
    [dismiss, show]
  );

  const variantClasses: Record<ToastVariant, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-100",
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-100",
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-100",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-100",
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex w-80 max-w-full flex-col items-end gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg backdrop-blur transition-all ${variantClasses[toast.variant]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
                <p className="text-sm leading-snug">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="mt-1 rounded-full p-1 text-xs text-current/70 transition hover:text-current"
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};
