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
import { PostType } from "@/types/Post";
import { useNewsFeedContext } from "@/context/NewsFeedContext";
import { Database } from "@/utils/supabase/supabase";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
  comment_likes?: { user_id: string }[] | null;
  isLiked?: boolean;
};

type BookmarkedNewsRow = NewsRow & {
  user_news_likes: { user_id: string }[] | null;
};

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
  initialMyPosts: PostType[];
  initialBookmarkedPosts: PostType[];
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

  // ⭐️ 초기 댓글에 isLiked 추가
  const initialCommentsWithLiked = useMemo(() => {
    return initialMyComments.map((comment) => ({
      ...comment,
      isLiked: !!(comment.comment_likes && comment.comment_likes.length > 0),
    }));
  }, [initialMyComments]);

  // ⭐️ 상태 관리
  const [myPosts, setMyPosts] = useState(initialMyPosts);
  const [myBookmarks, setMyBookmarks] = useState(initialBookmarks);
  const [myComments, setMyComments] = useState(initialCommentsWithLiked);

  // ✅ Realtime 구독 설정
  useEffect(() => {
    if (!profile?.id) return;

    const setupRealtime = async () => {
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      const channelName = `profile-activity:${profile.id}`;
      const channel = supabase.channel(channelName);

      console.log(`[ProfilePageClient] 🚀 Subscribing to: ${channelName}`);

      // ⭐️ posts 테이블 업데이트 감지 (like_count 변경)
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          console.log(`[ProfilePageClient] ✅ posts UPDATE:`, payload.new);
          const updatedPost = payload.new as PostType;

          // myPosts 업데이트
          setMyPosts((prev) =>
            prev.map((post) =>
              post.id === updatedPost.id
                ? { ...post, like_count: updatedPost.like_count, view_count: updatedPost.view_count }
                : post
            )
          );

          // myBookmarks 업데이트
          setMyBookmarks((prev) =>
            prev.map((item) => {
              if (item.type === "post" && item.id === updatedPost.id) {
                return { ...item, like_count: updatedPost.like_count };
              }
              return item;
            })
          );
        }
      );

      // ⭐️ comments 테이블 업데이트 감지 (like_count 변경)
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comments" },
        (payload) => {
          console.log(`[ProfilePageClient] ✅ comments UPDATE:`, payload.new);
          const updatedComment = payload.new as DbCommentRow;

          setMyComments((prev) =>
            prev.map((comment) =>
              comment.id === updatedComment.id
                ? { ...comment, like_count: updatedComment.like_count }
                : comment
            )
          );
        }
      );

      // ⭐️ news 테이블 업데이트 감지
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

      // ⭐️ user_post_likes 변경 감지 (내 좋아요 상태)
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_post_likes",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log(
            `[ProfilePageClient] ✅ user_post_likes ${payload.eventType}:`,
            payload.new || payload.old
          );

          if (payload.eventType === "INSERT") {
            const newLike = payload.new as { post_id: string; user_id: string };
            
            setMyPosts((prev) =>
              prev.map((post) =>
                post.id === newLike.post_id ? { ...post, isLiked: true } : post
              )
            );
            
            setMyBookmarks((prev) =>
              prev.map((item) => {
                if (item.type === "post" && item.id === newLike.post_id) {
                  return { ...item, isLiked: true };
                }
                return item;
              })
            );
          } else if (payload.eventType === "DELETE") {
            const oldLike = payload.old as { post_id: string; user_id: string };
            
            setMyPosts((prev) =>
              prev.map((post) =>
                post.id === oldLike.post_id ? { ...post, isLiked: false } : post
              )
            );
            
            setMyBookmarks((prev) =>
              prev.map((item) => {
                if (item.type === "post" && item.id === oldLike.post_id) {
                  return { ...item, isLiked: false };
                }
                return item;
              })
            );
          }
        }
      );

      // ⭐️ comment_likes 변경 감지 (댓글 좋아요 상태)
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comment_likes",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log(
            `[ProfilePageClient] ✅ comment_likes ${payload.eventType}:`,
            payload.new || payload.old
          );

          if (payload.eventType === "INSERT") {
            const newLike = payload.new as { comment_id: string; user_id: string };
            setMyComments((prev) =>
              prev.map((comment) =>
                comment.id === newLike.comment_id
                  ? { ...comment, isLiked: true }
                  : comment
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldLike = payload.old as { comment_id: string; user_id: string };
            setMyComments((prev) =>
              prev.map((comment) =>
                comment.id === oldLike.comment_id
                  ? { ...comment, isLiked: false }
                  : comment
              )
            );
          }
        }
      );

      // 뉴스 좋아요 상태 변경 감지
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

      // ⭐️ 게시글 북마크 삭제 감지
      channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_post_bookmarks",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log(
            `[ProfilePageClient] ✅ user_post_bookmarks DELETE:`,
            payload.old
          );
          const oldBookmark = payload.old as {
            post_id: string;
            user_id: string;
          };

          setMyBookmarks((prev) =>
            prev.filter((item) => {
              if (item.type === "post") {
                return item.id !== oldBookmark.post_id;
              }
              return true;
            })
          );
          
          // myPosts의 북마크 상태도 업데이트
          setMyPosts((prev) =>
            prev.map((post) =>
              post.id === oldBookmark.post_id
                ? { ...post, isBookmarked: false }
                : post
            )
          );
        }
      );

      // ⭐️ 게시글 북마크 추가 감지
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_post_bookmarks",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log(
            `[ProfilePageClient] ✅ user_post_bookmarks INSERT:`,
            payload.new
          );
          const newBookmark = payload.new as {
            post_id: string;
            user_id: string;
          };

          // myPosts의 북마크 상태 업데이트
          setMyPosts((prev) =>
            prev.map((post) =>
              post.id === newBookmark.post_id
                ? { ...post, isBookmarked: true }
                : post
            )
          );
        }
      );

      channel.subscribe((status, err) => {
        console.log(`[ProfilePageClient] Subscription status: ${status}`);

        if (status === "SUBSCRIBED") {
          console.log(`[ProfilePageClient] ✅ SUBSCRIBED successfully`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[ProfilePageClient] ❌ CHANNEL_ERROR:`, err);
          setTimeout(() => {
            console.log("[ProfilePageClient] 🔄 Retrying connection...");
            setupRealtime();
          }, 3000);
        } else if (status === "TIMED_OUT") {
          console.error(`[ProfilePageClient] ⏱️ TIMED_OUT:`, err);
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

  // ⭐️ 게시글 좋아요 토글 (Trigger가 like_count 자동 업데이트)
  const handlePostLikeToggle = useCallback(
    async (id: string) => {
      if (!profile) return;

      const postInMyPosts = myPosts.find((p) => p.id === id);
      const postInBookmarks = myBookmarks.find(
        (item) => item.type === "post" && item.id === id
      ) as (PostType & { type: "post" }) | undefined;

      const currentPost = postInMyPosts || postInBookmarks;
      if (!currentPost) return;

      const isCurrentlyLiked = currentPost.isLiked ?? false;
      const currentLikes = currentPost.like_count ?? 0;

      // 1. 낙관적 업데이트 (myPosts)
      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                isLiked: !isCurrentlyLiked,
                like_count: !isCurrentlyLiked
                  ? currentLikes + 1
                  : Math.max(0, currentLikes - 1),
              }
            : p
        )
      );

      // 1-2. 낙관적 업데이트 (myBookmarks) - type 속성 유지
      setMyBookmarks((prev) =>
        prev.map((item) => {
          if (item.type === "post" && item.id === id) {
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

      // 2. DB 업데이트 (Trigger가 자동으로 like_count 업데이트)
      try {
        if (isCurrentlyLiked) {
          const { error } = await supabase
            .from("user_post_likes")
            .delete()
            .eq("user_id", profile.id)
            .eq("post_id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_post_likes")
            .insert({ user_id: profile.id, post_id: id });
          if (error && error.code !== "23505") throw error;
        }
      } catch (error) {
        console.error("Post like toggle DB update failed:", error);
        // 3. 롤백 (myPosts)
        setMyPosts((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, isLiked: isCurrentlyLiked, like_count: currentLikes }
              : p
          )
        );
        // 3-2. 롤백 (myBookmarks)
        setMyBookmarks((prev) =>
          prev.map((item) => {
            if (item.type === "post" && item.id === id) {
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
    [supabase, profile, myPosts, myBookmarks]
  );

  // ⭐️ 게시글 북마크 토글
  const handlePostBookmarkToggle = useCallback(
    async (id: string) => {
      if (!profile) return;

      const postInMyPosts = myPosts.find((p) => p.id === id);
      const postInBookmarks = myBookmarks.find(
        (item) => item.type === "post" && item.id === id
      ) as PostType | undefined;

      const currentPost = postInMyPosts || postInBookmarks;
      if (!currentPost) return;

      const isCurrentlyBookmarked = currentPost.isBookmarked ?? false;

      // 1. 낙관적 업데이트
      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, isBookmarked: !isCurrentlyBookmarked } : p
        )
      );

      if (isCurrentlyBookmarked) {
        setMyBookmarks((prev) =>
          prev.filter((item) => !(item.type === "post" && item.id === id))
        );
      } else {
        const postToAdd = { ...currentPost, isBookmarked: true, type: "post" as const };
        setMyBookmarks((prev) => [postToAdd, ...prev]);
      }

      // 2. DB 업데이트
      try {
        const result = await togglePostBookmark(
          id,
          profile.id,
          isCurrentlyBookmarked
        );
        if (!result.success) {
          throw new Error(result.error ?? "북마크 토글 실패");
        }
      } catch (error) {
        console.error("Post bookmark toggle failed:", error);
        // 3. 롤백
        setMyPosts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, isBookmarked: isCurrentlyBookmarked } : p
          )
        );
        setMyBookmarks(initialBookmarks);
      }
    },
    [profile, myPosts, myBookmarks, togglePostBookmark, initialBookmarks]
  );

  // ⭐️ 댓글 좋아요 토글 (Trigger가 like_count 자동 업데이트)
  const handleCommentLikeToggle = useCallback(
    async (id: string) => {
      if (!profile) return;

      const currentComment = myComments.find((c) => c.id === id);
      if (!currentComment) return;

      const isCurrentlyLiked = currentComment.isLiked ?? false;
      const currentLikes = currentComment.like_count ?? 0;

      // 1. 낙관적 업데이트
      setMyComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                isLiked: !isCurrentlyLiked,
                like_count: !isCurrentlyLiked
                  ? currentLikes + 1
                  : Math.max(0, currentLikes - 1),
              }
            : c
        )
      );

      // 2. DB 업데이트 (Trigger가 자동으로 like_count 업데이트)
      try {
        if (isCurrentlyLiked) {
          const { error } = await supabase
            .from("comment_likes")
            .delete()
            .eq("user_id", profile.id)
            .eq("comment_id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("comment_likes")
            .insert({ user_id: profile.id, comment_id: id });
          if (error && error.code !== "23505") throw error;
        }
      } catch (error) {
        console.error("Comment like toggle DB update failed:", error);
        // 3. 롤백
        setMyComments((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  isLiked: isCurrentlyLiked,
                  like_count: currentLikes,
                }
              : c
          )
        );
      }
    },
    [supabase, profile, myComments]
  );

  // 북마크 탭에서의 북마크 토글 (삭제만)
  const handleProfileBookmarkToggle = useCallback(
    async (id: string, type: "post" | "news") => {
      if (!profile) return;

      setMyBookmarks((prev) => prev.filter((item) => item.id !== id));

      try {
        if (type === "news") {
          await handleNewsBookmarkToggle(id);
        } else {
          const result = await togglePostBookmark(id, profile.id, true);
          if (!result.success) {
            console.error(`포스트 북마크 해제 실패: ${result.error}`);
            setMyBookmarks(initialBookmarks);
          }
        }
      } catch (error) {
        console.error("북마크 토글 실패:", error);
        setMyBookmarks(initialBookmarks);
      }
    },
    [profile, handleNewsBookmarkToggle, togglePostBookmark, initialBookmarks]
  );

  // 뉴스 좋아요 토글
  const handleProfileNewsLikeToggle = useCallback(
    async (id: string) => {
      const currentItem = myBookmarks.find(
        (item) => item.type === "news" && item.id === id
      ) as NewsItemWithState | undefined;

      if (!currentItem) return;

      const isCurrentlyLiked = currentItem.isLiked;
      const currentLikes = currentItem.like_count ?? 0;

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
          onCommentLikeToggle={handleCommentLikeToggle}
          onPostBookmarkToggle={handlePostBookmarkToggle}
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