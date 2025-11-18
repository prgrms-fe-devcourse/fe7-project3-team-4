"use client";

import {
  Bookmark,
  BookmarkCheck,
  Eye,
  Heart,
  MessageSquare,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  viewCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
}

export default function PostActions({
  postId,
  likeCount,
  commentCount,
  viewCount,
  isLiked = false,
  isBookmarked = false,
  onLikeToggle,
  onBookmarkToggle,
}: PostActionsProps) {
  const [realtimeLiked, setRealtimeLiked] = useState(isLiked);
  const [realtimeBookmarked, setRealtimeBookmarked] = useState(isBookmarked);
  const supabase = createClient();

  useEffect(() => {
    setRealtimeLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setRealtimeBookmarked(isBookmarked);
  }, [isBookmarked]);

  useEffect(() => {
    let likesChannel: ReturnType<typeof supabase.channel> | null = null;
    let bookmarksChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscriptions = async () => {
      // 현재 유저 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 좋아요 상태 구독
      likesChannel = supabase
        .channel(`post-likes-${postId}-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_post_likes",
            filter: `post_id=eq.${postId}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            // payload에서 user_id 확인하여 현재 유저의 액션인지 체크
            if (payload.new?.user_id === user.id) {
              if (payload.eventType === "INSERT") {
                setRealtimeLiked(true);
              }
            }
            if (payload.old?.user_id === user.id) {
              if (payload.eventType === "DELETE") {
                setRealtimeLiked(false);
              }
            }
          }
        )
        .subscribe();

      // 북마크 상태 구독
      bookmarksChannel = supabase
        .channel(`post-bookmarks-${postId}-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_post_bookmarks",
            filter: `post_id=eq.${postId}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            // payload에서 user_id 확인하여 현재 유저의 액션인지 체크
            if (payload.new?.user_id === user.id) {
              if (payload.eventType === "INSERT") {
                setRealtimeBookmarked(true);
              }
            }
            if (payload.old?.user_id === user.id) {
              if (payload.eventType === "DELETE") {
                setRealtimeBookmarked(false);
              }
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscriptions();

    // Cleanup
    return () => {
      if (likesChannel) {
        supabase.removeChannel(likesChannel);
      }
      if (bookmarksChannel) {
        supabase.removeChannel(bookmarksChannel);
      }
    };
  }, [postId, supabase]);

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
    <div className="flex justify-center gap-10 lg:gap-30 text-[#717182] py-6 dark:text-[#A6A6DB]">
      <button
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          realtimeLiked
            ? "text-[#FF569B] bg-[#F7E6ED] dark:bg-[#e4c3cf]"
            : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
        }`}
        onClick={handleLikeClick}
        disabled={!onLikeToggle}
        aria-pressed={realtimeLiked}
        aria-label="좋아요"
      >
        <div className="flex gap-2 text-sm items-center">
          <Heart size={18} fill={"none"} />
          <span>{likeCount}</span>
        </div>
      </button>

      <button className="cursor-pointer py-1 px-2 rounded-md hover:bg-gray-200 dark:hover:text-[#6758FF] dark:hover:bg-[#A6A6DB]">
        <div className="flex gap-2 text-sm items-center">
          <MessageSquare size={18} />
          <span>{commentCount}</span>
        </div>
      </button>

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
            realtimeBookmarked
              ? "text-[#6758FF] bg-[#D8D4FF]"
              : "hover:text-[#6758FF] hover:bg-[#D8D4FF] dark:hover:bg-[#A6A6DB]"
          }`}
          aria-pressed={realtimeBookmarked}
          aria-label="북마크"
        >
          {realtimeBookmarked ? (
            <BookmarkCheck size={18} fill={"none"} />
          ) : (
            <Bookmark size={18} fill="none" />
          )}
        </button>
      )}
    </div>
  );
}
