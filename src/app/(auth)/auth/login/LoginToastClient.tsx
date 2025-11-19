"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/common/toast/ToastContext";

export default function LoginToastClient() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { showToast } = useToast();

  useEffect(() => {
    if (!from) return;

    const messageMap: Record<string, { title: string; message: string }> = {
      write: {
        title: "접근 실패",
        message: "글쓰기는 로그인 후 이용 가능합니다.",
      },
      message: {
        title: "접근 실패",
        message: "채팅은 로그인 후 이용 가능합니다.",
      },
      notification: {
        title: "접근 실패",
        message: "알림은 로그인 후 이용 가능합니다.",
      },
      profile: {
        title: "접근 실패",
        message: "프로필은 로그인 후 이용 가능합니다.",
      },
      history: {
        title: "접근 실패",
        message: "조회내역은 로그인 후 이용 가능합니다.",
      },
    };

    const config = messageMap[from];

    if (config) {
      showToast({
        title: config.title,
        message: config.message,
        variant: "warning",
      });
    }
  }, [from, showToast]);

  return null;
}
