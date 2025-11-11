"use client";

import { Heart, MessageSquare } from "lucide-react";

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  onLikeToggle?: (id: string) => void;
}

export default function PostActions({
  postId,
  likeCount,
  commentCount,
  onLikeToggle,
}: PostActionsProps) {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLikeToggle?.(postId);
  };

  return (
    <div className="flex justify-center gap-30 text-[#717182] py-6">
      <button
        className="cursor-pointer py-1 px-2 rounded-md hover:text-[#FF569B] hover:bg-[#F7E6ED]"
        onClick={handleLikeClick}
        disabled={!onLikeToggle}
      >
        <div className="flex gap-2 text-sm items-center ">
          <Heart size={18} />
          <span>{likeCount}</span>
        </div>
      </button>
      <button className="cursor-pointer py-1 px-2 rounded-md hover:bg-gray-200">
        <div className="flex gap-2 text-sm items-center">
          <MessageSquare size={18} />
          <span>{commentCount}</span>
        </div>
      </button>
    </div>
  );
}
