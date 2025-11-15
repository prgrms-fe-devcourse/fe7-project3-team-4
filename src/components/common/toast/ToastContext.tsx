"use client";

import { createContext, useContext } from "react";
import type { ToastVariant } from "./Toast";

export type ToastOptions = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("ToastProvider랑 같이 쓰셔야됩니당");
  }
  return ctx;
}

export default ToastContext;
