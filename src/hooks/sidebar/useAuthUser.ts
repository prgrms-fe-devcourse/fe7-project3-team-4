"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function useAuthUser() {
  const [isLogin, setIsLogin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLogin(!!user);
      setCurrentUserId(user?.id || null);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setIsLogin(!!user);
        setCurrentUserId(user?.id || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { isLogin, currentUserId };
}
