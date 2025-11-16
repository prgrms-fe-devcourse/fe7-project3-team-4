"use client";

import { Trophy } from "lucide-react";
import Box from "./Box";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import RankFollowButton from "./RankFollowButton";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useFollow } from "@/context/FollowContext";

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
  const [textTopUsers, setTextTopUsers] = useState<RankData[]>([]);
  const [imageTopUsers, setImageTopUsers] = useState<RankData[]>([]);
  /* const [topUsers, setTopUsers] = useState<RankData[]>([]); */
  const [isLoading, setIsLoading] = useState(true);

  // 현재 활성화된 주제 (텍스트 / 이미지)
  const [activeTopic, setActiveTopic] = useState<"text" | "image">("text");

  const topicLabel = activeTopic === "text" ? "텍스트 챌린지" : "이미지 챌린지";

  const supabase = createClient();

  // ✅ Follow Context 사용
  const { isFollowing, toggleFollow, currentUserId } = useFollow();

  const fetchRankData = useCallback(async () => {
    setIsLoading(true);

    /* 주간 - 텍스트 주제에서 좋아요 순 */
    const { data: postTextData, error: postTextError } = await supabase
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
      .eq("post_type", "weekly")
      .eq("result_mode", "Text")
      .order("like_count", { ascending: false });

    if (postTextError) {
      console.error(postTextError);
      setIsLoading(false);
      return;
    }

    if (!postTextData) {
      setTextTopUsers([]);
      setIsLoading(false);
      return;
    }

    const uniqueTextMap = new Map<string, RankData>();
    for (const post of postTextData) {
      const profile = post.profile as ProfileData | null;

      if (!uniqueTextMap.has(post.user_id!)) {
        uniqueTextMap.set(post.user_id!, {
          user_id: post.user_id!,
          like_count: post.like_count || 0,
          profile: profile,
        });
      }
    }
    const uniqueTextByUser = Array.from(uniqueTextMap.values());
    const sortedTextUsers = uniqueTextByUser.sort(
      (a, b) => b.like_count - a.like_count
    );
    setTextTopUsers(sortedTextUsers.slice(0, 4));

    /* 주간 - 이미지 주제에서 좋아요 순 */
    const { data: postImgData, error: postImgError } = await supabase
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
      .eq("post_type", "weekly")
      .eq("result_mode", "Image")
      .order("like_count", { ascending: false });

    if (postImgError) {
      console.error(postImgError);
      setIsLoading(false);
      return;
    }

    if (!postImgData) {
      setImageTopUsers([]);
      setIsLoading(false);
      return;
    }

    const uniqueImgMap = new Map<string, RankData>();
    for (const post of postImgData) {
      const profile = post.profile as ProfileData | null;

      if (!uniqueImgMap.has(post.user_id!)) {
        uniqueImgMap.set(post.user_id!, {
          user_id: post.user_id!,
          like_count: post.like_count || 0,
          profile: profile,
        });
      }
    }
    const uniqueImgByUser = Array.from(uniqueImgMap.values());
    const sortedImgUsers = uniqueImgByUser.sort(
      (a, b) => b.like_count - a.like_count
    );
    setImageTopUsers(sortedImgUsers.slice(0, 4));
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRankData();
  }, [fetchRankData]);

  // Realtime 구독 (posts 테이블만)
  useEffect(() => {
    const postChannel = supabase
      .channel("rank-posts-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: "post_type=eq.prompt",
        },
        (payload) => {
          console.log("Rank post updated, refetching rank data:", payload);
          fetchRankData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
    };
  }, [supabase, fetchRankData]);

  // 텍스트 / 이미지 순위 자동 전환
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveTopic((prev) => (prev === "text" ? "image" : "text"));
    }, 5000); // 5초마다 주제 변경 (원하는 시간으로 조절)

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  // ✅ Follow Context의 toggleFollow 사용
  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUserId) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      await toggleFollow(targetUserId);
    } catch (error) {
      console.error("Follow toggle failed:", error);

      // 사용자에게 에러 메시지 표시
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("팔로우 처리 중 오류가 발생했습니다.");
      }
    }
  };

  if (isLoading) {
    return (
      <Box height="284px" icon={<Trophy />} title="이번 주 챌린지 순위">
        <p className="text-center text-sm text-gray-500 py-8">
          랭킹을 불러오는 중...
        </p>
      </Box>
    );
  }

  if (textTopUsers.length === 0) {
    return (
      <Box height="284px" icon={<Trophy />} title="이번 주 챌린지 순위">
        <p className="text-center text-sm text-gray-500 py-8">
          아직 랭킹이 없습니다.
        </p>
      </Box>
    );
  }

  return (
    <Box height="284px" icon={<Trophy />} title="이번 주 챌린지 순위">
      {/* 주제 라벨 */}
      <div className="mb-2 flex items-center justify-center">
        <p className="text-sm font-semibold text-[#717182] dark:text-[#A6A6DB]">
          {topicLabel} TOP 3
        </p>
      </div>

      {/* ⭐ 슬라이더 영역 */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform:
              activeTopic === "text" ? "translateX(0%)" : "translateX(-100%)",
          }}
        >
          {/* === 슬라이드 1: 텍스트 챌린지 === */}
          <div className="w-full shrink-0 flex flex-col gap-4">
            {textTopUsers.map((item, index) => {
              const rankNumber = index + 1;
              const rankSuffix = getOrdinalSuffix(rankNumber);
              const profile = item.profile;
              const displayName = profile?.display_name ?? "익명";
              const email = profile?.email ?? "이메일 없음";
              const avatar = profile?.avatar_url;

              const userIsFollowing = isFollowing(item.user_id);
              const isSelf = currentUserId === item.user_id;

              const rankColor =
                rankNumber === 1
                  ? "#F7B500"
                  : rankNumber === 2
                  ? "#C0C0C0"
                  : rankNumber === 3
                  ? "#CD7F32"
                  : "#D1D5DB";

              return (
                <div
                  key={`text-${item.user_id}`}
                  className="cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/30 rounded-lg pr-2"
                >
                  <Link
                    href={`/profile?userId=${item.user_id}`}
                    className="flex items-center gap-1.5 flex-1 min-w-0 p-2"
                  >
                    <div className="w-8" style={{ color: rankColor }}>
                      {rankNumber}
                      {rankSuffix}.
                    </div>
                    <div className="flex-1 flex gap-2">
                      <div className="relative w-9 h-9 bg-gray-300 rounded-full overflow-hidden shrink-0">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={displayName}
                            fill
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
                        <p className="text-xs text-[#717182] truncate dark:text-[#A6A6DB]">
                          {email}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="shrink-0">
                    {!isSelf && (
                      <RankFollowButton
                        targetUserId={item.user_id}
                        isFollowing={userIsFollowing}
                        currentUserId={currentUserId}
                        onFollowToggle={handleFollowToggle}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* === 슬라이드 2: 이미지 챌린지 === */}
          <div className="w-full shrink-0 flex flex-col gap-4">
            {imageTopUsers.map((item, index) => {
              const rankNumber = index + 1;
              const rankSuffix = getOrdinalSuffix(rankNumber);
              const profile = item.profile;
              const displayName = profile?.display_name ?? "익명";
              const email = profile?.email ?? "이메일 없음";
              const avatar = profile?.avatar_url;

              const userIsFollowing = isFollowing(item.user_id);
              const isSelf = currentUserId === item.user_id;

              const rankColor =
                rankNumber === 1
                  ? "#F7B500"
                  : rankNumber === 2
                  ? "#C0C0C0"
                  : rankNumber === 3
                  ? "#CD7F32"
                  : "#D1D5DB";

              return (
                <div
                  key={`image-${item.user_id}`}
                  className="cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/30 rounded-lg pr-2"
                >
                  <Link
                    href={`/profile?userId=${item.user_id}`}
                    className="flex items-center gap-1.5 flex-1 min-w-0 p-2"
                  >
                    <div className="w-8" style={{ color: rankColor }}>
                      {rankNumber}
                      {rankSuffix}.
                    </div>
                    <div className="flex-1 flex gap-2">
                      <div className="relative w-9 h-9 bg-gray-300 rounded-full overflow-hidden shrink-0">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={displayName}
                            fill
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
                        <p className="text-xs text-[#717182] truncate dark:text-[#A6A6DB]">
                          {email}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="shrink-0">
                    {!isSelf && (
                      <RankFollowButton
                        targetUserId={item.user_id}
                        isFollowing={userIsFollowing}
                        currentUserId={currentUserId}
                        onFollowToggle={handleFollowToggle}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Box>
  );
}
