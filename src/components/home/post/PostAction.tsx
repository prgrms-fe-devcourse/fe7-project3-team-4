"use client";

import { Bookmark, BookmarkCheck, Eye, Heart, MessageSquare } from "lucide-react";
import React from "react";

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  viewCount?: number; // ⭐️ 추가
  isLiked?: boolean;
  isBookmarked?: boolean;
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
}

export default function PostActions({
  postId,
  likeCount,
  commentCount,
  viewCount, // ⭐️ 추가
  isLiked = false,
  isBookmarked = false,
  onLikeToggle,
  onBookmarkToggle,
}: PostActionsProps) {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLikeToggle?.(postId);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle?.(postId, "post");
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
        aria-pressed={isLiked}
        aria-label="좋아요"
      >
        <div className="flex gap-2 text-sm items-center">
          <Heart size={18} fill={"none"} />
          <span>{likeCount}</span>
        </div>
      </button>

      <button className="cursor-pointer py-1 px-2 rounded-md hover:bg-gray-200">
        <div className="flex gap-2 text-sm items-center">
          <MessageSquare size={18} />
          <span>{commentCount}</span>
        </div>
      </button>

      {/* ⭐️ viewCount가 있으면 조회수 표시, 없으면 북마크 표시 */}
      {viewCount !== undefined ? (
        <div className="py-1 px-2">
          <div className="flex gap-2 text-sm items-center">
            <Eye size={18} />
            <span>{viewCount}</span>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}