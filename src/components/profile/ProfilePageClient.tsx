"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ProfileActivityTabs,
  TabKey,
} from "@/components/profile/ProfileActivityTabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ImgEditModal } from "./ImgEditModal";
import { FormState, NewsItemWithState, NewsRow, Profile } from "@/types";
import { PostType } from "@/types/Post"; // [수정] PostType import 추가
import { useNewsFeedContext } from "@/context/NewsFeedContext";
import { Database } from "@/utils/supabase/supabase";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
};

type BookmarkedNewsRow = NewsRow & {
  user_news_likes: { user_id: string }[] | null;
};

// [수정] PostType 사용
type BookmarkedItem =
  | (PostType & { type: "post" })
  | (NewsItemWithState & { type: "news" });

type ProfilePageClientProps = {
  profile: Profile;
  initialTab: string;
  updateProfile: (
    prevState: FormState,
    formData: FormData
  ) => Promise<FormState>;
  updateAvatarUrl: (url: string) => Promise<FormState>;
  togglePostBookmark: (
    postId: string,
    currentUserId: string,
    isBookmarked: boolean
  ) => Promise<FormState>;
  initialMyPosts: PostType[]; // [수정] Post → PostType
  initialBookmarkedPosts: PostType[]; // [수정] Post → PostType
  initialBookmarkedNews: BookmarkedNewsRow[];
  initialMyComments: DbCommentRow[];
};

export default function ProfilePageClient({
  profile,
  initialTab,
  updateProfile,
  updateAvatarUrl,
  togglePostBookmark,
  initialMyPosts,
  initialBookmarkedPosts,
  initialBookmarkedNews,
  initialMyComments,
}: ProfilePageClientProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditImgOpen, setIsEditImgOpen] = useState(false);
  const [supabase] = useState(() => createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    handleLikeToggle: handleNewsLikeToggle,
    handleBookmarkToggle: handleNewsBookmarkToggle,
  } = useNewsFeedContext();

  const initialBookmarks = useMemo(() => {
    const posts: BookmarkedItem[] = initialBookmarkedPosts.map((p) => ({
      ...p,
      isBookmarked: true,
      type: "post",
    }));

    const news: BookmarkedItem[] = initialBookmarkedNews.map((n) => ({
      ...n,
      isLiked: !!(n.user_news_likes && n.user_news_likes.length > 0),
      isBookmarked: true,
      type: "news",
    }));

    return [...posts, ...news].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [initialBookmarkedPosts, initialBookmarkedNews]);

  const [myPosts] = useState(initialMyPosts);
  const [myBookmarks, setMyBookmarks] = useState(initialBookmarks);
  const [myComments] = useState(initialMyComments);

  // ✅ Realtime 구독 설정
  useEffect(() => {
    if (!profile?.id) return;

    const setupRealtime = async () => {
      // 기존 채널 정리
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      const channelName = `profile-bookmarks:${profile.id}`;
      const channel = supabase.channel(channelName);

      console.log(`[ProfilePageClient] 🚀 Subscribing to: ${channelName}`);

      // news 테이블 업데이트 감지 (좋아요 수 변경)
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "news" },
        (payload) => {
          console.log(`[ProfilePageClient] ✅ news UPDATE:`, payload.new);
          const updatedNews = payload.new as NewsRow;

          setMyBookmarks((prev) =>
            prev.map((item) => {
              if (item.type === "news" && item.id === updatedNews.id) {
                return {
                  ...item,
                  like_count: updatedNews.like_count,
                  view_count: updatedNews.view_count,
                };
              }
              return item;
            })
          );
        }
      );

      // 좋아요 상태 변경 감지
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_news_likes",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log(
            `[ProfilePageClient] ✅ user_news_likes ${payload.eventType}:`,
            payload.new || payload.old
          );

          if (payload.eventType === "INSERT") {
            const newLike = payload.new as { news_id: string; user_id: string };
            setMyBookmarks((prev) =>
              prev.map((item) => {
                if (item.type === "news" && item.id === newLike.news_id) {
                  return { ...item, isLiked: true };
                }
                return item;
              })
            );
          } else if (payload.eventType === "DELETE") {
            const oldLike = payload.old as { news_id: string; user_id: string };
            setMyBookmarks((prev) =>
              prev.map((item) => {
                if (item.type === "news" && item.id === oldLike.news_id) {
                  return { ...item, isLiked: false };
                }
                return item;
              })
            );
          }
        }
      );

      // 북마크 삭제 감지
      channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_news_bookmarks",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log(
            `[ProfilePageClient] ✅ user_news_bookmarks DELETE:`,
            payload.old
          );
          const oldBookmark = payload.old as {
            news_id: string;
            user_id: string;
          };

          // 북마크 목록에서 제거
          setMyBookmarks((prev) =>
            prev.filter((item) => {
              if (item.type === "news") {
                return item.id !== oldBookmark.news_id;
              }
              return true;
            })
          );
        }
      );

      channel.subscribe((status, err) => {
        console.log(`[ProfilePageClient] Subscription status: ${status}`);

        if (status === "SUBSCRIBED") {
          console.log(`[ProfilePageClient] ✅ SUBSCRIBED successfully`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[ProfilePageClient] ❌ CHANNEL_ERROR:`, err);
          // [추가] 재연결 시도
          setTimeout(() => {
            console.log("[ProfilePageClient] 🔄 Retrying connection...");
            setupRealtime();
          }, 3000);
        } else if (status === "TIMED_OUT") {
          console.error(`[ProfilePageClient] ⏱️ TIMED_OUT:`, err);
          // [추가] 재연결 시도
          setTimeout(() => {
            console.log("[ProfilePageClient] 🔄 Retrying after timeout...");
            setupRealtime();
          }, 3000);
        }
      });

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        console.log(`[ProfilePageClient] 🧹 Cleanup: removing channel`);
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [profile?.id, supabase]);

  const handleProfileBookmarkToggle = useCallback(
    async (id: string, type: "post" | "news") => {
      if (!profile) return;

      // 낙관적 업데이트: 즉시 UI에서 제거
      setMyBookmarks((prev) => prev.filter((item) => item.id !== id));

      try {
        if (type === "news") {
          await handleNewsBookmarkToggle(id);
        } else {
          const result = await togglePostBookmark(id, profile.id, true);
          if (!result.success) {
            console.error(`포스트 북마크 해제 실패: ${result.error}`);
            // 실패 시 롤백
            setMyBookmarks(initialBookmarks);
          }
        }
      } catch (error) {
        console.error("북마크 토글 실패:", error);
        // 에러 시 롤백
        setMyBookmarks(initialBookmarks);
      }
    },
    [profile, handleNewsBookmarkToggle, togglePostBookmark, initialBookmarks]
  );

// [수정] handlePostLikeToggle 로직 구현
  const handlePostLikeToggle = useCallback(
    async (id: string) => {
      if (!profile) return;

      const currentItem = myBookmarks.find(
        (item) => item.type === "post" && item.id === id
      ) as PostType | undefined;

      // (myPosts에서도 찾아볼 수 있지만, 북마크 탭이 아니면 이 핸들러가 호출되지 않음)
      // 여기서는 myBookmarks를 기준으로 우선 처리합니다.
      if (!currentItem) {
        console.warn("Could not find post in myBookmarks to like.");
        // MyPosts 탭에서 호출된 경우 myPosts 상태도 업데이트해야 하지만,
        // 현재 myPosts는 useState로만 관리되므로 이 로직은 myBookmarks 탭에서만 동작합니다.
        // MyPosts의 좋아요도 실시간 반영하려면 myPosts도 setMyPosts처럼 state로 관리해야 합니다.
        // 우선은 북마크 탭에서의 동작을 구현합니다.
        return;
      }

      const isCurrentlyLiked = currentItem.isLiked ?? false;
      const currentLikes = currentItem.like_count ?? 0;

      // 1. 낙관적 업데이트 (북마크 목록 상태)
      setMyBookmarks((prevBookmarks) =>
        prevBookmarks.map((item) => {
          if (item.id === id && item.type === "post") {
            return {
              ...item,
              isLiked: !isCurrentlyLiked,
              like_count: !isCurrentlyLiked
                ? currentLikes + 1
                : Math.max(0, currentLikes - 1),
            };
          }
          return item;
        })
      );
      
      // (참고: myPosts 상태도 업데이트해야 MyPosts 탭에서도 반영됨)
      // setMyPosts((prevPosts) => ... )

      // 2. DB 업데이트
      try {
        if (isCurrentlyLiked) {
          await supabase.rpc("decrement_like_count", { post_id: id });
          const { error } = await supabase
            .from("user_post_likes")
            .delete()
            .eq("user_id", profile.id)
            .eq("post_id", id);
          if (error) throw error;
        } else {
          await supabase.rpc("increment_like_count", { post_id: id });
          const { error } = await supabase
            .from("user_post_likes")
            .insert({ user_id: profile.id, post_id: id });
          if (error && error.code !== "23505") throw error;
        }
      } catch (error) {
        console.error("Post like toggle DB update failed:", error);
        // 3. 롤백
        setMyBookmarks((prevBookmarks) =>
          prevBookmarks.map((item) => {
            if (item.id === id && item.type === "post") {
              return {
                ...item,
                isLiked: isCurrentlyLiked,
                like_count: currentLikes,
              };
            }
            return item;
          })
        );
      }
    },
    [supabase, profile, myBookmarks] // [수정] 의존성 배열
  );

  const handleProfileNewsLikeToggle = useCallback(
    async (id: string) => {
      const currentItem = myBookmarks.find(
        (item) => item.type === "news" && item.id === id
      ) as NewsItemWithState | undefined;

      if (!currentItem) return;

      const isCurrentlyLiked = currentItem.isLiked;
      const currentLikes = currentItem.like_count ?? 0;

      // 낙관적 업데이트
      setMyBookmarks((prevBookmarks) =>
        prevBookmarks.map((item) => {
          if (item.id === id && item.type === "news") {
            return {
              ...item,
              isLiked: !isCurrentlyLiked,
              like_count: !isCurrentlyLiked
                ? currentLikes + 1
                : Math.max(0, currentLikes - 1),
            };
          }
          return item;
        })
      );

      try {
        await handleNewsLikeToggle(id);
      } catch (error) {
        console.error("Profile like toggle DB update failed:", error);
        // 실패 시 롤백
        setMyBookmarks((prevBookmarks) =>
          prevBookmarks.map((item) => {
            if (item.id === id && item.type === "news") {
              return {
                ...item,
                isLiked: isCurrentlyLiked,
                like_count: currentLikes,
              };
            }
            return item;
          })
        );
      }
    },
    [handleNewsLikeToggle, myBookmarks]
  );

  return (
    <>
      <div className="relative">
        <ProfileHeader
          profile={profile}
          onAvatarClick={() => setIsEditImgOpen(true)}
          onEditClick={() => setIsEditProfileOpen(true)}
        />
        <ProfileActivityTabs
          initialTab={initialTab as TabKey}
          myPosts={myPosts}
          myComments={myComments}
          myBookmarks={myBookmarks}
          onLikeToggle={handleProfileNewsLikeToggle}
          onBookmarkToggle={handleProfileBookmarkToggle}
          onPostLikeToggle={handlePostLikeToggle}
        />
      </div>

      <ProfileEditModal
        profile={profile}
        action={updateProfile}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <ImgEditModal
        profile={profile}
        action={updateAvatarUrl}
        isOpen={isEditImgOpen}
        onClose={() => setIsEditImgOpen(false)}
      />
    </>
  );
}
