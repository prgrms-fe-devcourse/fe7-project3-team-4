"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Heart, Eye, Bookmark, BookmarkCheck } from "lucide-react";
import { useNewsFeedContext } from "@/context/NewsFeedContext";

type DetailActionsProps = {
  id: string;
  initialLikes: number;
  initialViews: number;
  initialIsLiked: boolean;
  initialIsBookmarked: boolean;
};

export default function DetailActions({
  id,
  initialLikes,
  initialViews,
  initialIsLiked,
  initialIsBookmarked,
}: DetailActionsProps) {
  const [supabase] = useState(() => createClient());

  const { newsList, handleLikeToggle, handleBookmarkToggle } =
    useNewsFeedContext();

  // Context의 newsList에서 현재 아이템 상태 찾기
  const item = newsList.find((n) => n.id === id);
  const likes = item?.like_count ?? initialLikes;
  const isLiked = item?.isLiked ?? initialIsLiked;
  const isBookmarked = item?.isBookmarked ?? initialIsBookmarked;

  // 조회수는 이 페이지에서만 관리
  const [views, setViews] = useState(initialViews);
  const viewIncrementedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const incView = async () => {
      try {
        if (viewIncrementedRef.current) return;
        console.log(`[DetailActions] 👁️ Incrementing view for ID: ${id}`);
        viewIncrementedRef.current = true;
        setViews((v) => v + 1); // 낙관적 업데이트

        // RPC 대신 직접 UPDATE 쿼리 사용
        const { error } = await supabase
          .from("news")
          .update({ view_count: initialViews + 1 })
          .eq("id", id);

        if (error && mounted) {
          console.error("[DetailActions] View increment error:", error);
          setViews((v) => Math.max(0, v - 1)); // 롤백
          viewIncrementedRef.current = false;
        }
      } catch (err) {
        console.error("[DetailActions] View increment exception:", err);
        if (mounted) {
          setViews((v) => Math.max(0, v - 1));
          viewIncrementedRef.current = false;
        }
      }
    };
    const timer = setTimeout(incView, 1000);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [id, supabase, initialViews]);

  const onLikeClick = useCallback(() => {
    handleLikeToggle(id);
  }, [handleLikeToggle, id]);

  const onBookmarkClick = useCallback(() => {
    handleBookmarkToggle(id);
  }, [handleBookmarkToggle, id]);

  return (
    <div className="flex justify-center gap-30 text-[#717182] py-6 dark:text-[#A6A6DB]">
      {/* 좋아요 버튼 - NewsItem과 동일한 스타일 */}
      <button
        onClick={onLikeClick}
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          isLiked
            ? "text-[#FF569B] bg-[#F7E6ED]"
            : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
        }`}
        aria-pressed={isLiked}
        aria-label="좋아요"
      >
        <div className="flex gap-2 text-sm items-center">
          <Heart size={18} fill="none" />
          <span>{likes}</span>
        </div>
      </button>

      {/* 조회수 - 버튼이 아닌 표시용 */}
      <div className="py-1 px-2">
        <div className="flex gap-2 text-sm items-center">
          <Eye size={18} />
          <span>{views}</span>
        </div>
      </div>

      {/* 북마크 버튼 - NewsItem과 동일한 스타일 */}
      <button
        onClick={onBookmarkClick}
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          isBookmarked
            ? "text-[#6758FF] bg-[#D8D4FF]"
            : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
        }`}
        aria-pressed={isBookmarked}
        aria-label="북마크"
      >
        {isBookmarked ? (
          <BookmarkCheck size={18} fill="none" />
        ) : (
          <Bookmark size={18} fill="none" />
        )}
      </button>
    </div>
  );
}
