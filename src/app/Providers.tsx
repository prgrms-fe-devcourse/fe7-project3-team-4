"use client";

import { ReactNode } from "react";
import ToastProvider from "@/components/common/toast/ToastProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
