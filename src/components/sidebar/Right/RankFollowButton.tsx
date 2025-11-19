"use client";

import { useToast } from "@/components/common/toast/ToastContext";
import { useState } from "react";
// ⭐️ createClient는 DB 작업이 아닌 prop을 받으므로 제거해도 됩니다.
// import { createClient } from "@/utils/supabase/client";

interface RankFollowButtonProps {
  targetUserId: string;
  isFollowing: boolean; // ⭐️ 부모로부터 실시간 상태를 받음
  currentUserId: string | null;
  // ⭐️ 클릭 시 실행할 함수를 부모로부터 받음
  onFollowToggle: (targetUserId: string) => Promise<void>;
}

export default function RankFollowButton({
  targetUserId,
  isFollowing,
  currentUserId,
  onFollowToggle,
}: RankFollowButtonProps) {
  const { showToast } = useToast();
  // ⭐️ 로딩 상태만 자체적으로 관리
  const [isLoading, setIsLoading] = useState(false);
  // const supabase = createClient(); // ⭐️ 로직이 부모로 이동

  // ⭐️ 부모로부터 받은 함수를 실행
  const handleFollowClick = async () => {
    if (!currentUserId) {
      showToast({
        title: "팔로우 실패",
        message: "로그인 후 이용 가능합니다.",
        variant: "warning",
      });
      return;
    }
    if (currentUserId === targetUserId) {
      showToast({
        title: "팔로우 실패",
        message: "자기 자신을 팔로우할 수 없습니다.",
        variant: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      // ⭐️ 부모의 토글 함수 호출
      await onFollowToggle(targetUserId);
    } catch (error) {
      console.error("Error toggling follow:", error);
      showToast({
        title: "팔로우 오류",
        message: "팔로우 처리 중 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowClick} // ⭐️ 수정된 핸들러
      disabled={isLoading}
      className={`cursor-pointer text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? "text-gray-600 bg-gray-200 hover:bg-gray-300"
          : "text-white bg-[#6758FF] hover:bg-[#5648E5]"
      }`}
    >
      {isLoading ? "처리중..." : isFollowing ? "팔로잉" : "팔로우"}
    </button>
  );
}
