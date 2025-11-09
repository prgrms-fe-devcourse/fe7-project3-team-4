"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { SortKey } from "@/types"; // [추가]

type Tab = "전체" | "뉴스" | "프롬프트" | "자유" | "주간";

// [수정] NewsHeader.tsx의 props를 통합합니다.
type TopBarProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  sortBy?: SortKey;
  loadingUpload?: boolean;
  onSortChange?: (key: SortKey) => void;
  onAddPostClick?: () => void;
};

export default function TopBar({
  activeTab,
  onTabChange,
  sortBy = "published_at", // [수정]
  loadingUpload = false, // [수정]
  onSortChange, // [수정]
  onAddPostClick, // [수정]
}: TopBarProps) {
  const tabs: Tab[] = ["전체", "뉴스", "프롬프트", "자유", "주간"];

  // [추가] 정렬 상태
  const isSortByLikes = sortBy === "like_count";
  const isSortByDate = sortBy === "published_at";

  // [추가] 정렬 버튼 핸들러
  const handleSortClick = (key: SortKey) => {
    if (onSortChange) {
      onSortChange(key);
    }
  };

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
          {/* [수정] 정렬 버튼 로직 (NewsHeader 참고) */}
          <button
            onClick={() => handleSortClick("published_at")}
            className={`py-1 px-3 rounded-lg cursor-pointer text-[10px] ${
              isSortByDate
                ? "text-[#0A0A0A] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.10)]"
                : "text-[#9CA3AF] hover:text-[#0A0A0A]"
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => handleSortClick("like_count")}
            className={`py-1 px-3 rounded-lg cursor-pointer text-[10px] ${
              isSortByLikes
                ? "text-[#0A0A0A] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.10)]"
                : "text-[#9CA3AF] hover:text-[#0A0A0A]"
            }`}
          >
            인기순
          </button>
        </ul>

        {/* [수정] 새 게시글 버튼 (뉴스 탭일 때만 업로드 기능) */}
        {activeTab === "뉴스" && onAddPostClick ? (
          <button
            className="hidden lg:flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-linear-to-b from-[#8B8B8B] to-[#2C2C2E] shadow-[0px_1px_2px_rgba(0,0,0,0.1)] hover:translate-y-[-1.5px] disabled:opacity-50"
            disabled={loadingUpload}
            onClick={onAddPostClick}
          >
            <Plus size={14} color="#AEAEAE" />
            <span className="text-white text-[10px] leading-none">
              {loadingUpload ? "업로드 중..." : "새 게시글"}
            </span>
          </button>
        ) : (
          <Link className="hidden lg:block" href="/write">
            <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-linear-to-b from-[#8B8B8B] to-[#2C2C2E] shadow-[0px_1px_2px_rgba(0,0,0,0.1)] hover:translate-y-[-1.5px]">
              <Plus size={14} color="#AEAEAE" />
              <span className="text-white text-[10px] leading-none">
                새 게시글
              </span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}