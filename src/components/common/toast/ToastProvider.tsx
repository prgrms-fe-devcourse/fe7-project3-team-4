"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Toast from "./Toast";
import ToastContext, { ToastOptions } from "./ToastContext";

type ToastState = ToastOptions & { id: number };

type ToastProviderProps = {
  children: ReactNode;
};

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 지금 토스트가 떠 있는지에 대한 락
  const isShowingRef = useRef(false);

  const hideToast = useCallback(() => {
    setToast(null);
    isShowingRef.current = false; // 다시 호출 가능 상태로
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      // 이미 떠 있는 상태면, 같은 타이밍에 들어온 중복 호출은 무시
      if (isShowingRef.current) {
        return;
      }
      isShowingRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const id = Date.now();
      setToast({ id, ...options });

      const duration = options.duration ?? 2600;
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);

      console.log("showToast called: ", options);
    },
    [hideToast]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  console.log("ToastProvider state:", { toast });

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        open={!!toast}
        title={toast?.title}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}
