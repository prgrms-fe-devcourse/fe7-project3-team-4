"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/common/toast/ToastContext";

export default function LoginSuccessToastClient() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const searchString = params.toString();
    const loginParam = params.get("login");
    const codeParam = params.get("code");

    console.log("[LoginSuccessToastClient] search params:", searchString);
    console.log("[LoginSuccessToastClient] login param:", loginParam);
    console.log("[LoginSuccessToastClient] code param:", codeParam);

    const isLoginSuccess = loginParam === "success" || !!codeParam;

    if (isLoginSuccess) {
      showToast({
        title: "로그인 되었습니다",
        message: "환영합니다!",
        variant: "success",
      });

      // URL에서 login / code 파라미터 제거 (새로고침 시 토스트 반복 방지)
      const nextParams = new URLSearchParams(params.toString());
      nextParams.delete("login");
      nextParams.delete("code");

      const nextSearch = nextParams.toString();
      const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;

      console.log("[LoginSuccessToastClient] cleaning URL to:", nextUrl);

      router.replace(nextUrl, { scroll: false });
    }
  }, [params, pathname, router, showToast]);

  return null;
}
