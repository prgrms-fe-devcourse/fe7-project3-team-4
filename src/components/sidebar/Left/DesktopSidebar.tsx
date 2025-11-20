"use client";

import Link from "next/link";
import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import MenuBtn from "./MenuBtn";
import Logo from "../../../assets/svg/Logo";
import type { ReactNode } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

type MenuItem = {
  title: string;
  icon: ReactNode;
  url: string;
};

type DesktopSidebarProps = {
  menuItems: MenuItem[];
  pathname: string;
  currentUserId: string | null;
  profileUserId: string | null;
  unreadCount: number;
  unreadMessageCount: number;
  isLogin: boolean;
  onLogout: () => void;
  isActivePath: (
    pathname: string,
    url: string,
    currentUserId: string | null,
    profileUserId: string | null
  ) => boolean;
};

export function DesktopSidebar({
  menuItems,
  pathname,
  currentUserId,
  profileUserId,
  unreadCount,
  unreadMessageCount,
  isLogin,
  onLogout,
  isActivePath,
}: DesktopSidebarProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside className="hidden lg:flex flex-col h-full p-6 box-border bg-white/40 border border-white/20 rounded-xl shadow-xl dark:bg-white/20 dark:shadow-white/20">
      <Link href={"/"}>
        <Logo size="lg" />
      </Link>
      <ul className="flex-1 mt-6 flex flex-col justify-between gap-2">
        <div className="space-y-2">
          {menuItems.map((menu) => (
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
          <li className="rounded-full shadow-xl hover:bg-white hover:shadow-xl dark:hover:bg-white/30">
            <button onClick={toggleTheme} className="p-3 cursor-pointer">
              {!isDark ? <Moon /> : <Sun />}
            </button>
          </li>

          <li className="rounded-full shadow-xl hover:bg-white hover:shadow-xl dark:hover:bg-white/30">
            {!isLogin ? (
              <Link
                href={"auth/login"}
                className="flex items-center gap-4 flex-1 p-3"
              >
                <LogIn />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="cursor-pointer flex items-center gap-4 flex-1 p-3"
              >
                <LogOut />
              </button>
            )}
          </li>
        </div>
      </ul>
    </aside>
  );
}
