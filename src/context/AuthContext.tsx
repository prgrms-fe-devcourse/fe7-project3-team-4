// src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLogin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 클라이언트 사이드 Supabase 인스턴스 생성
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // getUser는 서버에 토큰 유효성을 검증하므로 보안상 안전합니다.
        // 이 호출을 전역에서 한 번만 수행하여 결과를 상태로 관리합니다.
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("User fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // 인증 상태 변경 리스너 (로그인/로그아웃 감지)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLogin: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Context를 쉽게 사용하기 위한 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}