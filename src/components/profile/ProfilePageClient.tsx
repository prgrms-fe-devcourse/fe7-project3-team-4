// src/components/profile/ProfilePageClient.tsx

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ProfileActivityTabs,
  TabKey,
} from "@/components/profile/ProfileActivityTabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ImgEditModal } from "./ImgEditModal";
import {
  FormState,
  NewsItemWithState,
  NewsRow,
  Post,
  Profile,
} from "@/types";
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

type BookmarkedItem =
  | (Post & { type: "post" })
  | (NewsItemWithState & { type: "news" });

type ProfilePageClientProps = {
  profile: Profile;
  initialTab: string;
  updateProfile: (prevState: FormState, formData: FormData) => Promise<FormState>;
  updateAvatarUrl: (url: string) => Promise<FormState>;
  togglePostBookmark: (
    postId: string,
    currentUserId: string,
    isBookmarked: boolean
  ) => Promise<FormState>;
  initialMyPosts: Post[];
  initialBookmarkedPosts: Post[];
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
      const dateA =
        a.type === "news"
          ? (a as NewsItemWithState).published_at
          : a.created_at;
      const dateB =
        b.type === "news"
          ? (b as NewsItemWithState).published_at
          : b.created_at;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
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

      const channelName = `profile-bookmarks:${profile.id}:${Date.now()}`;
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
          console.log(`[ProfilePageClient] ✅ user_news_likes ${payload.eventType}:`, payload.new || payload.old);
          
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
          console.log(`[ProfilePageClient] ✅ user_news_bookmarks DELETE:`, payload.old);
          const oldBookmark = payload.old as { news_id: string; user_id: string };
          
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
        if (status === "SUBSCRIBED") {
          console.log(`[ProfilePageClient] ✅ SUBSCRIBED successfully`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[ProfilePageClient] ❌ CHANNEL_ERROR:`, err);
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
  
  const handlePostLikeToggle = useCallback(async (id: string) => {
    console.log(`Post 좋아요 기능 미구현 (ID: ${id})`);
  }, []);

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