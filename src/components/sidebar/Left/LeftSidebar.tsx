"use client";

import MenuBtn from "./MenuBtn";
import {
  Bell,
  History,
  House,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
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
  { title: "채팅", icon: <MessageCircle />, url: "message" },
  { title: "프로필", icon: <User />, url: "profile" },
  { title: "조회 내역", icon: <History />, url: "views" },
  { title: "게시글 작성", icon: <Write />, url: "write" },
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
  // 안 읽은 알림 개수
  const [unreadCount, setUnreadCount] = useState(0);
  // 안 읽은 채팅 개수
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const profileUserId = searchParams.get("userId");

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLogin(!!user);
      setCurrentUserId(user?.id || null);
    };
    fetchUser(); // 인증 상태 변경 리스너 (로그인, 로그아웃 감지)

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user;
        setIsLogin(!!user);
        setCurrentUserId(user?.id || null);

        if (event === "SIGNED_OUT") {
          setUnreadCount(0);
          setUnreadMessageCount(0);
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const supabase = createClient();

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", currentUserId)
        .eq("is_read", false);

      if (error) {
        console.error("알림 개수 조회 오류:", error.message);
      } else {
        setUnreadCount(count ?? 0);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`notifications-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("새 알림 감지!", payload);
          fetchUnreadCount();
        }
      )
      .subscribe();

    const fetchUnreadMessageCount = async () => {
      const { data, error } = await supabase.rpc("get_unread_message_count");

      if (error) {
        console.error("안 읽은 메시지 개수 RPC 조회 오류:", error);
      } else {
        setUnreadMessageCount(data ?? 0);
      }
    };

    fetchUnreadMessageCount();

    // [신규] 채팅방 테이블 실시간 구독
    const chatChannel = supabase
      .channel(`message_rooms-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_rooms",
          filter: `pair_max=eq.${currentUserId}`, // 1. 내가 pair_max인 방의 업데이트 감지
        },
        (payload) => {
          console.log("채팅방 '읽음' 상태 변경 감지 (max):", payload);
          fetchUnreadMessageCount(); // 개수 다시 계산
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_rooms",
          filter: `pair_min=eq.${currentUserId}`, // 2. 내가 pair_min인 방의 업데이트 감지
        },
        (payload) => {
          console.log("채팅방 '읽음' 상태 변경 감지 (min):", payload);
          fetchUnreadMessageCount(); // 개수 다시 계산
        }
      )
      .subscribe();

    const newMessagesChannel = supabase
      .channel(`new-messages-for-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT", // 'messages' 테이블에 새 행이 삽입될 때
          schema: "public",
          table: "messages",
          // ★참고: RLS 정책(1단계 SQL)이 `sender_id != auth.uid()`로
          // 필터링하므로, 내가 보낸 메시지 INSERT도 여기서 감지되지만
          // 최종 카운트에는 포함되지 않아 안전합니다.
        },
        (payload) => {
          console.log("새 메시지 'INSERT' 감지:", payload);
          fetchUnreadMessageCount(); // 개수 다시 계산
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // 알림 채널
      supabase.removeChannel(chatChannel); // 채팅방 읽음 채널
      supabase.removeChannel(newMessagesChannel); // 새 메시지 채널
    };
  }, [currentUserId]);

  const handleLogout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  return (
    <>
      <aside className="hidden lg:block h-full p-6 box-border bg-white/40 border border-white/20 rounded-xl shadow-xl">
        <Link href={"/"}>
          <Logo />
        </Link>
        <ul className="min-h-[790px] mt-6 flex flex-col justify-between gap-2">
          <div>
            {MENU_ITEMS.map((menu) => (
              <MenuBtn
                key={menu.title}
                icon={menu.icon}
                title={menu.title}
                url={menu.url}
                active={isActivePath(
                  pathname,
                  menu.url,
                  currentUserId,
                  profileUserId
                )}
                notificationCount={
                  menu.title === "알림"
                    ? unreadCount
                    : menu.title === "채팅"
                    ? unreadMessageCount
                    : 0
                }
              />
            ))}
          </div>
          <div className="flex flex-row justify-center gap-6">
            <li className="rounded-full cursor-pointer shadow-xl p-3 hover:bg-white hover:shadow-xl">
              <Moon />
            </li>
            {/* <li className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-white hover:shadow-xl"> */}
            <li className="rounded-full cursor-pointer shadow-xl p-3 hover:bg-gray-200 hover:shadow-xl">
              {!isLogin ? (
                <Link
                  href={"auth/login"}
                  className="flex items-center gap-4 flex-1 "
                >
                  <LogIn />
                  {/* <span>로그인</span> */}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer flex items-center gap-4 flex-1 "
                >
                  <LogOut />
                  {/* <span>로그아웃</span> */}
                </button>
              )}
            </li>
          </div>
        </ul>
      </aside>
    </>
  );
}
