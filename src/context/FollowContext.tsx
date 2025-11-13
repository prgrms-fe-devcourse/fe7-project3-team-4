"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type FollowContextType = {
  followingIds: Set<string>;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (targetUserId: string) => Promise<void>;
  currentUserId: string | null;
};

const FollowContext = createContext<FollowContextType | null>(null);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    const initializeFollowData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        setCurrentUserId(null);
        setFollowingIds(new Set());
        return;
      }

      setCurrentUserId(user.id);

      // 현재 사용자가 팔로우하는 모든 사용자 ID 가져오기
      const { data: followData, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (error) {
        console.error("[FollowContext] Error fetching follows:", error);
        return;
      }

      if (followData) {
        setFollowingIds(new Set(followData.map((f) => f.following_id)));
      }
    };

    initializeFollowData();
  }, [supabase]);

  // Realtime 구독 설정
  useEffect(() => {
    if (!currentUserId) return;

    // 기존 채널 정리
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // 전역 follows 변경 감지
    const followsChannel = supabase
      .channel(`global-follows:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `follower_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("[FollowContext] 🔔 Follow change detected:", payload);

          if (payload.eventType === "INSERT") {
            const newFollow = payload.new as {
              follower_id: string;
              following_id: string;
            };
            console.log(`[FollowContext] ✅ Now following: ${newFollow.following_id}`);
            setFollowingIds((prev) => {
              const updated = new Set(prev);
              updated.add(newFollow.following_id);
              return updated;
            });
          } else if (payload.eventType === "DELETE") {
            const oldFollow = payload.old as {
              follower_id: string;
              following_id: string;
            };
            console.log(`[FollowContext] ❌ Unfollowed: ${oldFollow.following_id}`);
            setFollowingIds((prev) => {
              const updated = new Set(prev);
              updated.delete(oldFollow.following_id);
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`[FollowContext] Subscription status: ${status}`);
        if (status === "SUBSCRIBED") {
          console.log("[FollowContext] ✅ Successfully subscribed to follows");
        }
      });

    channelRef.current = followsChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId, supabase]);

  // 팔로우 토글 함수
  const toggleFollow = useCallback(
    async (targetUserId: string) => {
      if (!currentUserId) {
        const error = new Error("로그인이 필요합니다.");
        console.warn("[FollowContext] No current user, cannot toggle follow");
        throw error;
      }

      if (currentUserId === targetUserId) {
        const error = new Error("자기 자신을 팔로우할 수 없습니다.");
        console.warn("[FollowContext] Cannot follow yourself");
        throw error;
      }

      const wasFollowing = followingIds.has(targetUserId);
      const willFollow = !wasFollowing;

      // Optimistic update
      setFollowingIds((prev) => {
        const updated = new Set(prev);
        if (willFollow) {
          updated.add(targetUserId);
        } else {
          updated.delete(targetUserId);
        }
        return updated;
      });

      try {
        if (willFollow) {
          const { error } = await supabase
            .from("follows")
            .insert({ follower_id: currentUserId, following_id: targetUserId });
          
          if (error) {
            console.error("[FollowContext] Supabase error (follow):", error);
            throw error;
          }
          console.log(`[FollowContext] ✅ Successfully followed ${targetUserId}`);
        } else {
          const { error } = await supabase
            .from("follows")
            .delete()
            .eq("follower_id", currentUserId)
            .eq("following_id", targetUserId);
          
          if (error) {
            console.error("[FollowContext] Supabase error (unfollow):", error);
            throw error;
          }
          console.log(`[FollowContext] ✅ Successfully unfollowed ${targetUserId}`);
        }
      } catch (error) {
        console.error("[FollowContext] Follow toggle failed:", {
          error,
          message: error instanceof Error ? error.message : "Unknown error",
          targetUserId,
          currentUserId,
          wasFollowing,
          willFollow
        });
        
        // Rollback on error
        setFollowingIds((prev) => {
          const updated = new Set(prev);
          if (wasFollowing) {
            updated.add(targetUserId);
          } else {
            updated.delete(targetUserId);
          }
          return updated;
        });

        // Re-throw with more context
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("팔로우 처리 중 오류가 발생했습니다.");
        }
      }
    },
    [currentUserId, followingIds, supabase]
  );

  // 특정 유저를 팔로우하고 있는지 확인
  const isFollowing = useCallback(
    (userId: string): boolean => {
      return followingIds.has(userId);
    },
    [followingIds]
  );

  return (
    <FollowContext.Provider
      value={{
        followingIds,
        isFollowing,
        toggleFollow,
        currentUserId,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
}