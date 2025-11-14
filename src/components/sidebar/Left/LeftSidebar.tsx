"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { DesktopSidebar } from "./DesktopSidebar";
import { useAuthUser } from "@/hooks/sidebar/useAuthUser";
import { useUnreadCounts } from "@/hooks/sidebar/useUnreadCounts";
import { MENU_ITEMS } from "./menuConfig";
import { MobileHeader } from "./MobileHeader";
import { useState } from "react";

function isActivePath(
  pathname: string,
  url: string,
  currentUserId: string | null,
  profileUserId: string | null
): boolean {
  if (!url || url.startsWith("http")) return false;

  const target = url.startsWith("/") ? url : `/${url}`;

  if (target === "/") {
    return pathname === "/";
  }

  if (target === "/profile") {
    if (pathname === target || pathname.startsWith(`${target}/`)) {
      return !profileUserId || profileUserId === currentUserId;
    }
    return false;
  }

  return pathname === target || pathname.startsWith(`${target}/`);
}

export default function LeftSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profileUserId = searchParams.get("userId");

  const [clickMenu, setClickMenu] = useState(false);

  const { isLogin, currentUserId } = useAuthUser();
  const { unreadCount, unreadMessageCount } = useUnreadCounts(currentUserId);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  const handleMenu = () => setClickMenu((prev) => !prev);

  return (
    <>
      <DesktopSidebar
        menuItems={MENU_ITEMS}
        pathname={pathname}
        currentUserId={currentUserId}
        profileUserId={profileUserId}
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessageCount}
        isLogin={isLogin}
        onLogout={handleLogout}
        isActivePath={isActivePath}
      />
      {/* 나중에 MobileHeader 추가할 거면 이 아래에 붙이면 됨 */}
      <MobileHeader
        isLogin={isLogin}
        clickMenu={clickMenu}
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessageCount}
        onToggleMenu={handleMenu}
        onLogout={handleLogout}
      />
    </>
  );
}
