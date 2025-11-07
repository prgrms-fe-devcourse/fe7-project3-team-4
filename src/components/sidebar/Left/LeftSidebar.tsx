"use client";

import MenuBtn from "./MenuBtn";
import { Bell, House, MessageCircle, Search, User } from "lucide-react";
import Gemini from "../../../assets/svg/Gemini";
import GPT from "../../../assets/svg/GPT";
import Write from "../../../assets/svg/Write";
import Logo from "../../../assets/svg/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

function isActivePath(pathname: string, url: string): boolean {
  if (!url || url.startsWith("http")) return false;

  const target = url.startsWith("/") ? url : `/${url}`;

  if (target === "/") {
    return pathname === "/";
  }

  return pathname === target || pathname.startsWith(`${target}/`);
}

export default function LeftSidebar() {
  const pathname = usePathname();
  return (
    <>
      <aside className="hidden md:block h-full p-6 box-border bg-white/40 border border-white/20 rounded-xl shadow-[0px_10px_25px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)]">
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
              active={isActivePath(pathname, menu.url)}
            />
          ))}
        </ul>
      </aside>
    </>
  );
}
