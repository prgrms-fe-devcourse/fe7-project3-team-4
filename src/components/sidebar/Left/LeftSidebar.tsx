"use client";

import MenuBtn from "./MenuBtn";
import {
  Bell,
  House,
  LogIn,
  LogOut,
  MessageCircle,
  Search,
  User,
} from "lucide-react";
import Gemini from "../../../assets/svg/Gemini";
import GPT from "../../../assets/svg/GPT";
import Write from "../../../assets/svg/Write";
import Logo from "../../../assets/svg/Logo";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const MENU_ITEMS = [
  { title: "홈", icon: <House />, url: "/" },
  { title: "검색", icon: <Search />, url: "search" },
  { title: "알림", icon: <Bell />, url: "notify" },
  {
    title: "GPT",
    icon: <GPT />,
    url: "https://chatgpt.com/",
  },
  {
    title: "Gemini",
    icon: <Gemini />,
    url: "https://gemini.google.com/",
  },
  { title: "게시글 작성", icon: <Write />, url: "write" },
  { title: "채팅", icon: <MessageCircle />, url: "message" },
  { title: "프로필", icon: <User />, url: "profile" },
];

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

  // 프로필 페이지인 경우, 로그인한 사용자 본인의 프로필일 때만 active
  if (target === "/profile") {
    if (pathname === target || pathname.startsWith(`${target}/`)) {
      // userId 파라미터가 없거나, 현재 사용자 ID와 같을 때만 active
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
  const [isLogin, setIsLogin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // URL에서 userId 파라미터 가져오기
  const profileUserId = searchParams.get("userId");

  useEffect(() => {
    const run = async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLogin(!!user);
      setCurrentUserId(user?.id || null);
    };
    run();
  }, []);

  const handleLogout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    setIsLogin(false);
    setCurrentUserId(null);
    router.refresh(); // Supabase 세션 반영된 서버 컴포넌트들 새로고침
    router.push("/auth/login"); // 원하는 경로로 이동
  };

  return (
    <>
      <aside className="hidden lg:block h-full p-6 box-border bg-white/40 border border-white/20 rounded-xl shadow-xl">
        {/* 로고 아이콘 */}
        <Link href={"/"}>
          <Logo />
        </Link>
        <ul className="space-y-2 mt-6">
          {MENU_ITEMS.map((menu) => (
            <MenuBtn
              key={menu.title}
              icon={menu.icon}
              title={menu.title}
              url={menu.url}
              active={isActivePath(pathname, menu.url, currentUserId, profileUserId)}
            />
          ))}
          <li className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-white hover:shadow-xl">
            {!isLogin ? (
              <Link
                href={"auth/login"}
                className="flex items-center gap-4 flex-1 "
              >
                <LogIn />
                <span>로그인</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="cursor-pointer flex items-center gap-4 flex-1 "
              >
                <LogOut />
                <span>로그아웃</span>
              </button>
            )}
          </li>
        </ul>
      </aside>
    </>
  );
}