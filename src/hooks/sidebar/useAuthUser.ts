// src/hooks/sidebar/useAuthUser.ts
"use client";

import { useAuth } from "@/context/AuthContext"; // 경로는 실제 파일 위치에 맞게 조정

export function useAuthUser() {
  // Context에서 이미 로드된 상태를 가져옵니다.
  const { isLogin, user, loading } = useAuth();

  return { 
    isLogin, 
    currentUserId: user?.id || null,
    user,      // 필요하다면 user 객체 자체도 반환
    isLoading: loading // 로딩 상태가 필요하다면 추가
  };
}