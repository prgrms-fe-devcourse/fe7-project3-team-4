"use client";

import Link from "next/link";
import { ReactNode, MouseEvent } from "react";

type MenuBtnProps = {
  icon: ReactNode;
  title: string;
  url?: string;
  active?: boolean;
  onClick?: () => void;
};

export default function MenuBtn({
  icon,
  title,
  url = "/",
  active = false,
  onClick,
}: MenuBtnProps) {
  const base = "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer";
  const activeStyle =
    "bg-[#6758FF] text-white shadow-[0px_10px_25px_rgba(0,0,0,0.16),0px_4px_10px_rgba(0,0,0,0.12)]";
  const inactiveStyle = "text-[#0A0A0A] hover:bg-white hover:shadow-xl";

  const className = `${base} ${active ? activeStyle : inactiveStyle}`;

  const isExternal = url.startsWith("http");

  const handleClick = (e: MouseEvent<HTMLAnchorElement | HTMLLIElement>) => {
    e.preventDefault();
    if (onClick) onClick();
  };

  if (isExternal) {
    return (
      <li className={className} onClick={handleClick}>
        {icon}
        <a href={url} target="_blank" rel="noreferrer" className="flex-1">
          {title}
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
        {icon}
        <span>{title}</span>
      </Link>
    </li>
  );
}
