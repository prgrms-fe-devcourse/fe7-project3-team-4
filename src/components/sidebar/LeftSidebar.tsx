"use client";

import { useState } from "react";
import MenuBtn from "./MenuBtn";
import { Bell, House, MessageCircle, Search, User } from "lucide-react";
import Gemini from "../svg/Gemini";
import GPT from "../svg/GPT";
import Write from "../svg/Write";

const MENU_ITEMS = [
  { title: "홈", icon: <House /> },
  { title: "검색", icon: <Search /> },
  { title: "알림", icon: <Bell /> },
  {
    title: "GPT",
    icon: <GPT />,
  },
  {
    title: "Gemini",
    icon: <Gemini />,
  },
  { title: "게시글 작성", icon: <Write /> },
  { title: "채팅", icon: <MessageCircle /> },
  { title: "프로필", icon: <User /> },
];

export default function LeftSidebar() {
  const [activeMenu, setActiveMenu] = useState("홈");
  return (
    <>
      <aside className="hidden md:block h-full p-6 box-border bg-white/40 border border-white/20 rounded-xl shadow-[0px_10px_25px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)]">
        {/* 로고 아이콘 */}
        <div className="w-[75px] h-[70px] bg-gray-500"></div>
        <ul className="space-y-2 mt-6">
          {MENU_ITEMS.map((menu) => (
            <MenuBtn
              key={menu.title}
              icon={menu.icon}
              title={menu.title}
              active={activeMenu === menu.title}
              onClick={() => setActiveMenu(menu.title)}
            />
          ))}
        </ul>
      </aside>
    </>
  );
}
