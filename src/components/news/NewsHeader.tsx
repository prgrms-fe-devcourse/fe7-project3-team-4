"use client";

import { SortKey } from "@/types";

type NewsHeaderProps = {
  sortBy: SortKey;
  loadingUpload: boolean;
  onSortChange: (key: SortKey) => void;
  onAddPostClick: () => void;
};

export default function NewsHeader({
  sortBy,
  loadingUpload,
  onSortChange,
  onAddPostClick,
}: NewsHeaderProps) {
  const isSortByLikes = sortBy === "like_count";
  const isSortByDate = sortBy === "published_at";

  return (
    <header className="sticky top-0 z-10 bg-white/40 border border-[#C2C2C2] rounded-lg backdrop-blur-sm">
      <div className="h-[38px]">
        <div className="flex justify-between items-center px-4 h-full">
          {/* 탭 메뉴 */}
          <div className="flex items-center text-sm font-medium bg-[#EEEEF0] rounded-lg h-[26px]">
            <button className="flex items-center h-[26px] px-3 rounded-lg bg-white text-blue-600 font-semibold shadow-sm">
              뉴스
            </button>
          </div>
          {/* 정렬 + 버튼 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm bg-[#EEEEF0] rounded-lg h-[26px]">
              {/* [클린 코드] 버튼 상태를 변수로 관리하여 가독성 향상 */}
              <button
                onClick={() => onSortChange("like_count")}
                className={`flex items-center h-[26px] px-3 rounded-lg transition-colors ${
                  isSortByLikes
                    ? "bg-white text-blue-600 font-semibold shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-pressed={isSortByLikes} // 접근성
              >
                인기순
              </button>
              <button
                onClick={() => onSortChange("published_at")}
                className={`flex items-center h-[26px] px-3 rounded-lg transition-colors ${
                  isSortByDate
                    ? "bg-white text-blue-600 font-semibold shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-pressed={isSortByDate} // 접근성
              >
                최신순
              </button>
            </div>
            <button
              onClick={onAddPostClick}
              disabled={loadingUpload}
              className="bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 ml-2"
            >
              + 새 게시글
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}