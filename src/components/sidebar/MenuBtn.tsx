"use client";
import { ReactNode } from "react";

export default function MenuBtn({
  icon,
  title,
  active,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const base =
    "cursor-pointer flex items-center gap-4 px-4 py-3 rounded-xl transition-all";
  const activeStyle =
    "bg-[#6758FF] text-white shadow-[0px_10px_25px_rgba(0,0,0,0.16),0px_4px_10px_rgba(0,0,0,0.12)]";
  const inactiveStyle = "hover:bg-white hover:shadow-xl";

  const className = `${base} ${active ? activeStyle : inactiveStyle}`;

  const isExternal = title === "GPT" || title === "Gemini";
  const href =
    title === "GPT"
      ? "https://chatgpt.com/"
      : title === "Gemini"
      ? "https://gemini.google.com/"
      : undefined;

  if (isExternal && href) {
    return (
      <li className={className} onClick={onClick}>
        {icon}
        <a href={href} rel="noreferrer" className="flex-1">
          {title}
        </a>
      </li>
    );
  }

  return (
    <li className={className} onClick={onClick}>
      {icon}
      <span>{title}</span>
    </li>
  );
}
