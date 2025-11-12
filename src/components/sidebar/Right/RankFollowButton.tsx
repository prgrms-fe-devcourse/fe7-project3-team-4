"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface RankFollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  currentUserId: string | null;
}

export default function RankFollowButton({
  targetUserId,
  initialIsFollowing,
  currentUserId,
}: RankFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (currentUserId === targetUserId) {
      alert("자기 자신을 팔로우할 수 없습니다.");
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // 언팔로우
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        // 팔로우
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
          });

        if (error) throw error;
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("팔로우 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`cursor-pointer text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? "text-gray-600 bg-gray-200 hover:bg-gray-300"
          : "text-white bg-[#6758FF] hover:bg-[#5648E5]"
      }`}
    >
      {isLoading ? "처리중..." : isFollowing ? "팔로잉" : "팔로우"}
    </button>
  );
}