"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useToast } from "@/components/common/toast/ToastContext";
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

  const { showToast } = useToast();

  // 좌측 메뉴 / 모바일 메뉴 상태
  const [clickMenu, setClickMenu] = useState(false);

  // 로그아웃 모달 열림 여부
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // 팀원이 만든 훅들 사용 (dev 쪽 구조 유지)
  const { isLogin, currentUserId } = useAuthUser();
  const { unreadCount, unreadMessageCount } = useUnreadCounts(currentUserId);

  // 실제 로그아웃 + 토스트까지 담당하는 핵심 함수
  const handleLogoutCore = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");

    showToast({
      title: "로그아웃 완료",
      message: "알고와 함께 해줘서 고마워요!",
      variant: "default",
    });
  };

  // 사이드바/헤더에서 호출하는 함수: "로그아웃 요청" -> 모달만 열기
  const handleLogoutRequest = () => {
    setLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    await handleLogoutCore();
    setLogoutModalOpen(false);
  };

  const handleCancelLogout = () => {
    setLogoutModalOpen(false);
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
        onLogout={handleLogoutRequest}
        isActivePath={isActivePath}
      />

      <MobileHeader
        isLogin={isLogin}
        clickMenu={clickMenu}
        setClickMenu={setClickMenu}
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessageCount}
        onToggleMenu={handleMenu}
        onLogout={handleLogoutRequest}
      />

      {logoutModalOpen && (
        <ConfirmModal
          open={logoutModalOpen}
          title="로그아웃"
          description="정말 로그아웃하시겠습니까?"
          onCancel={handleCancelLogout}
          onConfirm={handleConfirmLogout}
        />
      )}
    </>
  );
}
