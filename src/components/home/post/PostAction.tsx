"use client";

import { Bookmark, BookmarkCheck, Heart, MessageSquare } from "lucide-react"; // [수정] Bookmark 임포트
import React from "react"; // [추가] React 임포트

// [수정] Props 인터페이스 확장
interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void; // [수정] 타입 일치
}

export default function PostActions({
  postId,
  likeCount,
  commentCount,
  isLiked = false, // [추가]
  isBookmarked = false, // [추가]
  onLikeToggle,
  onBookmarkToggle, // [추가]
}: PostActionsProps) {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLikeToggle?.(postId);
  };

  // [추가] 북마크 핸들러
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle?.(postId, "post"); // 'post' 타입으로 호출
  };

  return (
    <div className="flex justify-center gap-30 text-[#717182] py-6">
      <button
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          isLiked
            ? "text-[#FF569B] bg-[#F7E6ED]"
            : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
        }`}
        onClick={handleLikeClick}
        disabled={!onLikeToggle}
        aria-pressed={isLiked} // [추가]
        aria-label="좋아요"
      >
        <div className="flex gap-2 text-sm items-center ">
          <Heart size={18} fill={"none"} />
          <span>{likeCount}</span>
        </div>
      </button>
      {/* 댓글 버튼 누르면 댓글창으로 focusing 되도록(예정) */}
      <button className="cursor-pointer py-1 px-2 rounded-md hover:bg-gray-200">
        <div className="flex gap-2 text-sm items-center">
          <MessageSquare size={18} />
          <span>{commentCount}</span>
        </div>
      </button>
      {/* [추가] 북마크 버튼 (NewsItem.tsx 참조) */}
      <button
        onClick={handleBookmarkClick}
        disabled={!onBookmarkToggle}
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          isBookmarked
            ? "text-[#6758FF] bg-[#D8D4FF]"
            : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
        }`}
        aria-pressed={isBookmarked}
        aria-label="북마크"
      >
        {isBookmarked ? (
          <BookmarkCheck size={18} fill={"none"} />
        ) : (
          <Bookmark size={18} fill={"none"} />
        )}
      </button>
    </div>
  );
}
