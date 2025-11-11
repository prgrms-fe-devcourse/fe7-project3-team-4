"use client";

import { useState, useTransition } from "react";
import Post from "./Post";
import type { PostType } from "@/types/Post";
import { togglePostBookmark } from "@/utils/actions/togglePostBookmark";
import { togglePostLike } from "@/utils/actions/togglePostLike";

export default function PostWrapper({ data }: { data: PostType }) {
  const [, startTransition] = useTransition();
  const [optimisticData, setOptimisticData] = useState(data);

  const handleLikeToggle = (id: string) => {
    setOptimisticData((prev) => ({
      ...prev,
      isLiked: !prev.isLiked,
      like_count: prev.isLiked ? prev.like_count - 1 : prev.like_count + 1,
    }));

    startTransition(async () => {
      try {
        await togglePostLike(id);
      } catch (err) {
        // 실패 시 롤백
        setOptimisticData(data);
        console.error("Like/like 롤백 실행:", err);
      }
    });
  };

  const handleBookmarkToggle = (id: string, type: "post" | "news") => {
    if (type === "news") return; // 뉴스 타입 제외

    setOptimisticData((prev) => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
    }));

    startTransition(async () => {
      try {
        await togglePostBookmark(id);
      } catch (err) {
        setOptimisticData(data);
        console.error("Like/Bookmark 롤백 실행:", err);
      }
    });
  };

  return (
    <Post
      data={optimisticData}
      onLikeToggle={handleLikeToggle}
      onBookmarkToggle={handleBookmarkToggle}
    />
  );
}
