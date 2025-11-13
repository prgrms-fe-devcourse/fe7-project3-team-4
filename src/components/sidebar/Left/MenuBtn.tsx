"use client";

import Link from "next/link";
import { ReactNode } from "react";

type MenuBtnProps = {
  icon: ReactNode;
  title: string;
  url?: string;
  active?: boolean;
  onClick?: () => void;
  notificationCount?: number;
};

export default function MenuBtn({
  icon,
  title,
  url = "/",
  active = false,
  onClick,
  notificationCount = 0,
}: MenuBtnProps) {
  const base =
    "relative flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer";
  const activeStyle =
    "bg-[#6758FF] text-white shadow-[0px_10px_25px_rgba(0,0,0,0.16),0px_4px_10px_rgba(0,0,0,0.12)]";
  const inactiveStyle = "text-[#0A0A0A] hover:bg-white hover:shadow-xl";

  const className = `${base} ${active ? activeStyle : inactiveStyle}`;

  const isExternal = url.startsWith("http");

  const content = (
    <>
      {icon}
      <span>{title}</span>

      {notificationCount > 0 && (
        <span className="absolute top-2 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {notificationCount > 9 ? "9+" : notificationCount}
        </span>
      )}
    </>
  );

  if (isExternal) {
    return (
      <li className={className}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 flex-1"
          onClick={onClick}
        >
          {content}
        </a>
      </li>
    );
  }

  const href = url.startsWith("/") ? url : `/${url}`;

  return (
    <li className={className}>
      <Link
        href={href}
        className="flex items-center gap-4 flex-1"
        onClick={onClick}
      >
        {content}
      </Link>
    </li>
  );
}
