"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

type Tab = "전체" | "뉴스" | "프롬프트" | "자유" | "주간";

export default function TopBar({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  const tabs: Tab[] = ["전체", "뉴스", "프롬프트", "자유", "주간"];

  return (
    <div className="w-full p-1 bg-white/40 border border-[#C2C2C2] rounded-lg flex justify-between items-center text-xs backdrop-blur">
      {/* left: 탭 */}
      <ul className="text-[#9CA3AF] flex gap-2 bg-[#EEEEF0] p-0.5 rounded-lg items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <li
              key={tab}
              onClick={() => onTabChange(tab)}
              className={[
                "py-1 px-3 rounded-lg cursor-pointer transition-all duration-200",
                isActive
                  ? "text-[#0A0A0A] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.10)]"
                  : "text-[#9CA3AF] hover:text-[#0A0A0A]",
              ].join(" ")}
            >
              {tab}
            </li>
          );
        })}
      </ul>

      {/* right: 정렬 + 새 글 */}
      <div className="flex items-center gap-1.5">
        <ul className="text-[#9CA3AF] flex gap-1 bg-[#EEEEF0] p-0.5 rounded-lg items-center">
          <button className="py-1 px-3 text-[#0A0A0A] bg-white rounded-lg shadow-[0px_1px_2px_rgba(0,0,0,0.10)] cursor-pointer text-[10px]">
            최신순
          </button>
          <li className="py-1 px-3 cursor-pointer text-[10px]">인기순</li>
        </ul>

        <Link className="hidden lg:block" href="/write">
          <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-linear-to-b from-[#8B8B8B] to-[#2C2C2E] shadow-[0px_1px_2px_rgba(0,0,0,0.1)] hover:translate-y-[-1.5px]">
            <Plus size={14} color="#AEAEAE" />
            <span className="text-white text-[10px] leading-none">
              새 게시글
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
