"use client";

import { Trophy } from "lucide-react";
import Box from "./Box";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import RankFollowButton from "./RankFollowButton";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";

const FOLLOWS_CHANNEL = "follows-update-channel";

const getOrdinalSuffix = (n: number) => {
  if (n % 100 >= 11 && n % 100 <= 13) {
    return "th";
  }
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

// ⭐️ 4. 데이터 타입을 위한 인터페이스
type ProfileData = {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type RankData = {
  user_id: string;
  profile: ProfileData | null;
  like_count: number;
};

export default function Rank() {
  const [topUsers, setTopUsers] = useState<RankData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // ⭐️ 6. Supabase 클라이언트 인스턴스
  const supabase = createClient();

  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);

  // ⭐️ 7. 데이터 페칭 함수 (useCallback으로 감싸기)
  const fetchRankData = useCallback(
    async (userId: string | null) => {
      setIsLoading(true);

      // 1. 랭킹 데이터 가져오기
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select(
          `
        user_id, 
        like_count,
        profile:user_id ( 
          display_name,
          email,
          avatar_url
        )
      `
        )
        .eq("post_type", "prompt")
        .order("like_count", { ascending: false });

      if (postError) {
        console.error(postError);
        setIsLoading(false);
        return;
      }

      if (!postData) {
        setTopUsers([]);
        setIsLoading(false);
        return;
      }

      // 2. 데이터 가공
      const uniqueMap = new Map<string, RankData>();
      for (const post of postData) {
        const profile = post.profile as ProfileData | null;

        if (!uniqueMap.has(post.user_id!)) {
          uniqueMap.set(post.user_id!, {
            user_id: post.user_id!,
            like_count: post.like_count || 0,
            profile: profile,
          });
        }
      }
      const uniqueByUser = Array.from(uniqueMap.values());
      // 랭킹 순 정렬
      const sortedUsers = uniqueByUser.sort(
        (a, b) => b.like_count - a.like_count
      );
      setTopUsers(sortedUsers.slice(0, 4));

      // 3. 팔로우 데이터 가져오기 (로그인 시)
      if (userId) {
        const { data: followData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId);

        if (followData) {
          setFollowingIds(new Set(followData.map((f) => f.following_id)));
        }
      }
      setIsLoading(false);
    },
    [supabase]
  ); // supabase 객체는 변경되지 않음

  // ⭐️ 8. 마운트 시 유저 정보 확인 및 데이터 페칭
  useEffect(() => {
    const getUserAndFetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || null;
      setCurrentUserId(userId);
      await fetchRankData(userId);
    };

    getUserAndFetchData();
  }, [supabase, fetchRankData]);

  // ⭐️ 9. Realtime 구독
  useEffect(() => {
    // 1. posts 테이블 (랭킹 변동)
    const postChannel = supabase
      .channel("rank-posts-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // 좋아요(like_count)는 UPDATE
          schema: "public",
          table: "posts",
          filter: "post_type=eq.prompt", // 프롬프트 게시물만
        },
        (payload) => {
          console.log("Rank post updated, refetching rank data:", payload);
          // 랭킹 데이터 다시 불러오기
          fetchRankData(currentUserId);
        }
      )
      .subscribe();

    const followBroadcastChannel = supabase.channel(FOLLOWS_CHANNEL, {
      config: { broadcast: { ack: true } },
    });

    // ✅ 해결: 채널을 생성한 직후 즉시 ref에 할당합니다.
    broadcastChannelRef.current = followBroadcastChannel;
    console.log("[Rank] 🔵 Channel instance created and assigned to ref.");

    followBroadcastChannel
      .on("broadcast", { event: "follow-update" }, () => {
        // ... (메시지 수신 로직)
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Rank] ✅ Subscribed to Broadcast");
          // ❗️ Ref 할당 로직이 여기서 제거되었습니다.
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // 구독 실패 시 에러 로깅
          console.error(`[Rank] ❌ Broadcast subscription failed: ${status}`);
        }
      });

    // cleanup
    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(followBroadcastChannel);
      // ✅ (권장) 컴포넌트 unmount 시 ref를 null로 초기화합니다.
      broadcastChannelRef.current = null;
    };
  }, [supabase, currentUserId, fetchRankData]);

  // ⭐️ 팔로우 토글 핸들러 수정
  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUserId) return;

    const currentIsFollowing = followingIds.has(targetUserId);
    const newIsFollowing = !currentIsFollowing;

    // 1. 낙관적 UI 업데이트
    setFollowingIds((prevIds) => {
      const newIds = new Set(prevIds);
      if (newIsFollowing) {
        newIds.add(targetUserId);
      } else {
        newIds.delete(targetUserId);
      }
      return newIds;
    });

    try {
      // 2. DB 작업
      if (newIsFollowing) {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);
        if (error) throw error;
      }

      // 3. ⭐️ ref에 저장된 채널로 broadcast 발송
      if (broadcastChannelRef.current) {
        await broadcastChannelRef.current.send({
          type: "broadcast",
          event: "follow-update",
          payload: { targetUserId, isFollowing: newIsFollowing },
        });
        console.log("[Rank] 📤 Broadcast sent:", {
          targetUserId,
          isFollowing: newIsFollowing,
        });
      } else {
        console.warn("[Rank] ⚠️ Broadcast channel not ready");
      }
    } catch (error) {
      console.error("Follow toggle failed, rolling back:", error);
      // 4. 롤백
      setFollowingIds((prevIds) => {
        const newIds = new Set(prevIds);
        if (currentIsFollowing) {
          newIds.add(targetUserId);
        } else {
          newIds.delete(targetUserId);
        }
        return newIds;
      });
    }
  };

  // ⭐️ 10. 로딩 및 데이터 없음 UI 처리
  if (isLoading) {
    return (
      <Box height="284px" icon={<Trophy />} title="지난 주 챌린지 순위">
        <p className="text-center text-sm text-gray-500 py-8">
          랭킹을 불러오는 중...
        </p>
      </Box>
    );
  }

  if (topUsers.length === 0) {
    return (
      <Box height="284px" icon={<Trophy />} title="지난 주 챌린지 순위">
        <p className="text-center text-sm text-gray-500 py-8">
          아직 랭킹이 없습니다.
        </p>
      </Box>
    );
  }

  // ⭐️ 11. JSX 렌더링
  return (
    <Box height="284px" icon={<Trophy />} title="지난 주 챌린지 순위">
      <div className="flex flex-col gap-4">
        {topUsers.map((item, index) => {
          const rankNumber = index + 1;
          const rankSuffix = getOrdinalSuffix(rankNumber);
          const profile = item.profile;
          const displayName = profile?.display_name ?? "익명";
          const email = profile?.email ?? "이메일 없음";
          const avatar = profile?.avatar_url;
          // ⭐️ State에서 팔로우 상태 확인
          const isFollowing = followingIds.has(item.user_id);
          const isSelf = currentUserId === item.user_id;

          const rankColor =
            rankNumber === 1
              ? "#EFAF00"
              : rankNumber === 2
              ? "#C0C0C0"
              : rankNumber === 3
              ? "#CD7F32"
              : "#D1D5DB";

          return (
            <div
              key={item.user_id}
              className="flex justify-between items-center"
            >
              <Link
                href={`/profile?userId=${item.user_id}`}
                className="flex items-center gap-1.5 flex-1 min-w-0 mr-4 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="w-8" style={{ color: rankColor }}>
                  {rankNumber}
                  {rankSuffix}.
                </div>
                <div className="relative w-9 h-9 bg-gray-300 rounded-full overflow-hidden shrink-0">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={displayName}
                      fill={true}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="flex items-center justify-center h-full w-full text-gray-500 text-lg font-semibold">
                      {(displayName[0] || "?").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate">{displayName}</p>
                  <p className="text-[11px] text-[#717182] truncate">
                    @{email}
                  </p>
                </div>
              </Link>
              <div className="shrink-0">
                {!isSelf && (
                  <RankFollowButton
                    targetUserId={item.user_id}
                    isFollowing={isFollowing} // ⭐️ 실시간 state 전달
                    currentUserId={currentUserId}
                    onFollowToggle={handleFollowToggle} // ⭐️ 핸들러 전달
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Box>
  );
}
