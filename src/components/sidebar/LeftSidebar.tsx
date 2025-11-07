"use client";

import { useState } from "react";
import MenuBtn from "./MenuBtn";
import { Bell, House, MessageCircle, Search, User } from "lucide-react";
import Gemini from "../svg/Gemini";
import GPT from "../svg/GPT";
import Write from "../svg/Write";
import Logo from "../svg/Logo";
import Link from "next/link";

const MENU_ITEMS = [
  { title: "홈", icon: <House />, url: "" },
  { title: "검색", icon: <Search />, url: "search" },
  { title: "알림", icon: <Bell />, url: "notify" },
  {
    title: "GPT",
    icon: <GPT />,
  },
  {
    title: "Gemini",
    icon: <Gemini />,
  },
  { title: "게시글 작성", icon: <Write />, url: "write" },
  { title: "채팅", icon: <MessageCircle />, url: "message" },
  { title: "프로필", icon: <User />, url: "profile" },
];

export default function LeftSidebar() {
  const [activeMenu, setActiveMenu] = useState("홈");
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
              active={activeMenu === menu.title}
              onClick={() => setActiveMenu(menu.title)}
            />
          ))}
        </ul>
      </aside>
    </>
  );
}
