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
import { useFollow } from "@/context/FollowContext";

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
  currentUserId: string;
  targetUserId: string;
  isFollowing: boolean;
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
  currentUserId,
  targetUserId,
  isFollowing: initialIsFollowing,
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

  // ✅ Follow Context 사용
  const { isFollowing: isFollowingFromContext, toggleFollow } = useFollow();

  const isOwnProfile = currentUserId === targetUserId;

  const [localProfile, setLocalProfile] = useState<Profile>(profile);
  const [myPosts, setMyPosts] = useState<PostType[]>(initialMyPosts);
  const [myComments, setMyComments] = useState<DbCommentRow[]>(
    initialMyComments.map((c) => ({
      ...c,
      isLiked: !!(c.comment_likes && c.comment_likes.length > 0),
    }))
  );

  const initialBookmarks = useMemo(() => {
    const posts = initialBookmarkedPosts.map((p) => ({
      ...p,
      type: "post" as const,
    }));
    const news = initialBookmarkedNews.map((n) => ({
      ...n,
      type: "news" as const,
      isLiked: !!(n.user_news_likes && n.user_news_likes.length > 0),
      isBookmarked: true,
    }));
    return [...posts, ...news].sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  }, [initialBookmarkedPosts, initialBookmarkedNews]);

  const [myBookmarks, setMyBookmarks] =
    useState<BookmarkedItem[]>(initialBookmarks);

  // ✅ Context에서 팔로우 상태 가져오기
  const isFollowing = isFollowingFromContext(targetUserId);

  // targetUserId 변경 시 모든 state 강제 리셋
  useEffect(() => {
    setLocalProfile(profile);
    setMyPosts(initialMyPosts);
    setMyComments(
      initialMyComments.map((c) => ({
        ...c,
        isLiked: !!(c.comment_likes && c.comment_likes.length > 0),
      }))
    );
    setMyBookmarks(initialBookmarks);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [
    targetUserId,
    profile,
    initialMyPosts,
    initialMyComments,
    initialBookmarks,
    supabase,
  ]);

  // ✅ Follow Context의 toggleFollow 사용
  const handleFollowToggle = useCallback(async () => {
    if (currentUserId === targetUserId) return;

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
  }, [toggleFollow, currentUserId, targetUserId]);

  const bookmarkedNewsIds = useMemo(
    () =>
      myBookmarks
        .filter((item) => item.type === "news")
        .map((item) => `${item.id}`),
    [myBookmarks]
  );

  // 메인 Realtime 구독 (팔로우 제외)
  useEffect(() => {
    if (!targetUserId || !currentUserId) return;

    const setupRealtime = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channelName = `profile-activity:${targetUserId}:${currentUserId}`;
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      console.log(`[ProfilePageClient] 🚀 Subscribing to: ${channelName}`);

      // 1. profiles
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${targetUserId}`,
        },
        (payload) => {
          console.log(`[profiles UPDATE]`, payload.new);
          const newProfileData = payload.new as Profile;
          setLocalProfile((prev) => {
            if (!prev) return newProfileData;
            return {
              ...prev,
              following_count: newProfileData!.following_count,
              followed_count: newProfileData!.followed_count,
              display_name: newProfileData!.display_name,
              bio: newProfileData!.bio,
              avatar_url: newProfileData!.avatar_url,
            };
          });
        }
      );

      // 2. posts
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          const updatedPost = payload.new as PostType;
          setMyPosts((prev) =>
            prev.map((post) =>
              post.id === updatedPost.id
                ? {
                    ...post,
                    like_count: updatedPost.like_count,
                    view_count: updatedPost.view_count,
                  }
                : post
            )
          );
          setMyBookmarks((prev) =>
            prev.map((item) =>
              item.type === "post" && item.id === updatedPost.id
                ? { ...item, like_count: updatedPost.like_count }
                : item
            )
          );
        }
      );

      // 3. comments
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
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

      // 4. news
      if (bookmarkedNewsIds.length > 0) {
        channel.on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "news",
            filter: `id=in.(${bookmarkedNewsIds.join(",")})`,
          },
          (payload) => {
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
      }

      // 5. user_post_likes
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_post_likes",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLike = payload.new as { post_id: string };
            updatePostLikeState(newLike.post_id, true);
          } else if (payload.eventType === "DELETE") {
            const oldLike = payload.old as { post_id: string };
            updatePostLikeState(oldLike.post_id, false);
          }
        }
      );

      // 6. comment_likes
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comment_likes",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLike = payload.new as { comment_id: string };
            updateCommentLikeState(newLike.comment_id, true);
          } else if (payload.eventType === "DELETE") {
            const oldLike = payload.old as { comment_id: string };
            updateCommentLikeState(oldLike.comment_id, false);
          }
        }
      );

      // 7. user_news_likes
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_news_likes",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLike = payload.new as { news_id: string };
            updateNewsLikeState(newLike.news_id, true);
          } else if (payload.eventType === "DELETE") {
            const oldLike = payload.old as { news_id: string };
            updateNewsLikeState(oldLike.news_id, false);
          }
        }
      );

      // 8. user_news_bookmarks DELETE
      channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_news_bookmarks",
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          const oldBookmark = payload.old as { news_id: string };
          setMyBookmarks((prev) =>
            prev.filter(
              (item) =>
                !(item.type === "news" && item.id === oldBookmark.news_id)
            )
          );
        }
      );

      // 9. user_post_bookmarks DELETE
      channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_post_bookmarks",
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          const oldBookmark = payload.old as { post_id: string };
          setMyBookmarks((prev) =>
            prev.filter(
              (item) =>
                !(item.type === "post" && item.id === oldBookmark.post_id)
            )
          );
          setMyPosts((prev) =>
            prev.map((post) =>
              post.id === oldBookmark.post_id
                ? { ...post, isBookmarked: false }
                : post
            )
          );
        }
      );

      // 10. user_post_bookmarks INSERT
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_post_bookmarks",
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          const newBookmark = payload.new as { post_id: string };
          let postToAdd: PostType | undefined;

          setMyPosts((prev) =>
            prev.map((post) => {
              if (post.id === newBookmark.post_id) {
                postToAdd = post;
                return { ...post, isBookmarked: true };
              }
              return post;
            })
          );

          if (postToAdd) {
            setMyBookmarks((prev) => [
              { ...postToAdd!, isBookmarked: true, type: "post" as const },
              ...prev,
            ]);
          }
        }
      );

      channel.subscribe((status, err) => {
        console.log(`[ProfilePageClient] Subscription status: ${status}`);
        if (status === "SUBSCRIBED") {
          console.log(`[ProfilePageClient] ✅ SUBSCRIBED successfully`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[ProfilePageClient] ❌ CHANNEL_ERROR:`, err);
          setTimeout(() => setupRealtime(), 3000);
        } else if (status === "TIMED_OUT") {
          console.error(`[ProfilePageClient] ⏱️ TIMED_OUT:`, err);
          setTimeout(() => setupRealtime(), 3000);
        }
      });
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [targetUserId, currentUserId, supabase, bookmarkedNewsIds]);

  const updatePostLikeState = (postId: string, isLiked: boolean) => {
    setMyPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, isLiked } : post))
    );
    setMyBookmarks((prev) =>
      prev.map((item) =>
        item.type === "post" && item.id === postId ? { ...item, isLiked } : item
      )
    );
  };

  const updateCommentLikeState = (commentId: string, isLiked: boolean) => {
    setMyComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, isLiked } : comment
      )
    );
  };

  const updateNewsLikeState = (newsId: string, isLiked: boolean) => {
    setMyBookmarks((prev) =>
      prev.map((item) =>
        item.type === "news" && item.id === newsId ? { ...item, isLiked } : item
      )
    );
  };

  const handlePostLikeToggle = useCallback(
    async (id: string) => {
      if (!currentUserId) return;

      let originalPostInMyPosts: PostType | undefined;
      let originalPostInBookmarks: BookmarkedItem | undefined;

      setMyPosts((prev) => {
        originalPostInMyPosts = prev.find((p) => p.id === id);
        return prev.map((post) =>
          post.id === id
            ? {
                ...post,
                isLiked: !(post.isLiked ?? false),
                like_count: !(post.isLiked ?? false)
                  ? (post.like_count ?? 0) + 1
                  : Math.max(0, (post.like_count ?? 0) - 1),
              }
            : post
        );
      });

      setMyBookmarks((prev) => {
        const item = prev.find((i) => i.type === "post" && i.id === id);
        if (item) originalPostInBookmarks = { ...item };

        return prev.map((item) => {
          if (item.type === "post" && item.id === id) {
            return {
              ...item,
              isLiked: !(item.isLiked ?? false),
              like_count: !(item.isLiked ?? false)
                ? (item.like_count ?? 0) + 1
                : Math.max(0, (item.like_count ?? 0) - 1),
            };
          }
          return item;
        });
      });

      try {
        const isCurrentlyLiked =
          originalPostInMyPosts?.isLiked ??
          originalPostInBookmarks?.isLiked ??
          false;

        if (isCurrentlyLiked) {
          await supabase
            .from("user_post_likes")
            .delete()
            .eq("user_id", currentUserId)
            .eq("post_id", id);
        } else {
          await supabase
            .from("user_post_likes")
            .insert({ user_id: currentUserId, post_id: id });
        }
      } catch (error) {
        console.error("Post like toggle failed:", error);

        if (originalPostInMyPosts) {
          setMyPosts((prev) =>
            prev.map((post) => (post.id === id ? originalPostInMyPosts! : post))
          );
        }
        if (originalPostInBookmarks) {
          setMyBookmarks((prev) =>
            prev.map((item) =>
              item.type === "post" && item.id === id
                ? originalPostInBookmarks!
                : item
            )
          );
        }
      }
    },
    [supabase, currentUserId]
  );

  const handlePostBookmarkToggle = useCallback(
    async (id: string) => {
      if (!currentUserId) return;

      let originalPostInMyPosts: PostType | undefined;
      let originalMyBookmarks: BookmarkedItem[] | undefined;
      let isCurrentlyBookmarked: boolean | undefined;
      let postForBookmarkList: (PostType & { type: "post" }) | undefined;

      setMyPosts((prev) => {
        originalPostInMyPosts = prev.find((p) => p.id === id);
        if (originalPostInMyPosts) {
          isCurrentlyBookmarked = originalPostInMyPosts.isBookmarked ?? false;
          postForBookmarkList = {
            ...originalPostInMyPosts,
            isBookmarked: !isCurrentlyBookmarked,
            type: "post",
          };
        }
        return prev.map((post) =>
          post.id === id
            ? { ...post, isBookmarked: !(post.isBookmarked ?? false) }
            : post
        );
      });

      setMyBookmarks((prev) => {
        originalMyBookmarks = prev;

        if (isCurrentlyBookmarked === undefined) {
          const item = prev.find((i) => i.type === "post" && i.id === id);
          if (item) {
            isCurrentlyBookmarked = (item as PostType).isBookmarked ?? false;
            postForBookmarkList = {
              ...(item as PostType),
              isBookmarked: !isCurrentlyBookmarked,
              type: "post",
            };
          }
        }

        if (isCurrentlyBookmarked === undefined) return prev;

        if (isCurrentlyBookmarked) {
          return prev.filter(
            (item) => !(item.type === "post" && item.id === id)
          );
        } else {
          if (!postForBookmarkList) return prev;
          return [postForBookmarkList, ...prev];
        }
      });

      if (isCurrentlyBookmarked === undefined) return;

      try {
        const result = await togglePostBookmark(
          id,
          currentUserId,
          isCurrentlyBookmarked
        );
        if (!result.success) {
          throw new Error(result.error ?? "북마크 토글 실패");
        }
      } catch (error) {
        console.error("Post bookmark toggle failed:", error);

        if (originalPostInMyPosts) {
          setMyPosts((prev) =>
            prev.map((p) => (p.id === id ? originalPostInMyPosts! : p))
          );
        }
        if (originalMyBookmarks) {
          setMyBookmarks(originalMyBookmarks);
        }
      }
    },
    [currentUserId, togglePostBookmark]
  );

  const handleCommentLikeToggle = useCallback(
    async (id: string) => {
      if (!currentUserId) return;

      let originalComment: DbCommentRow | undefined;

      setMyComments((prev) => {
        originalComment = prev.find((c) => c.id === id);
        return prev.map((comment) =>
          comment.id === id
            ? {
                ...comment,
                isLiked: !(comment.isLiked ?? false),
                like_count: !(comment.isLiked ?? false)
                  ? (comment.like_count ?? 0) + 1
                  : Math.max(0, (comment.like_count ?? 0) - 1),
              }
            : comment
        );
      });

      if (!originalComment) return;

      try {
        const isCurrentlyLiked = originalComment.isLiked ?? false;
        if (isCurrentlyLiked) {
          await supabase
            .from("comment_likes")
            .delete()
            .eq("user_id", currentUserId)
            .eq("comment_id", id);
        } else {
          await supabase
            .from("comment_likes")
            .insert({ user_id: currentUserId, comment_id: id });
        }
      } catch (error) {
        console.error("Comment like toggle failed:", error);

        setMyComments((prev) =>
          prev.map((comment) =>
            comment.id === id ? originalComment! : comment
          )
        );
      }
    },
    [supabase, currentUserId]
  );

  const handleProfileBookmarkToggle = useCallback(
    async (id: string, type: "post" | "news") => {
      if (!currentUserId) return;

      let originalMyBookmarks: BookmarkedItem[] | undefined;

      setMyBookmarks((prev) => {
        originalMyBookmarks = prev;
        return prev.filter((item) => item.id !== id);
      });

      try {
        if (type === "news") {
          await handleNewsBookmarkToggle(id);
        } else {
          const result = await togglePostBookmark(id, currentUserId, true);
          if (!result.success) {
            throw new Error(result.error ?? "포스트 북마크 해제 실패");
          }
        }
      } catch (error) {
        console.error("북마크 토글 실패:", error);

        if (originalMyBookmarks) {
          setMyBookmarks(originalMyBookmarks);
        }
      }
    },
    [currentUserId, handleNewsBookmarkToggle, togglePostBookmark]
  );

  const handleProfileNewsLikeToggle = useCallback(
    async (id: string) => {
      if (!currentUserId) return;

      let originalNewsItem: BookmarkedItem | undefined;

      setMyBookmarks((prev) => {
        const item = prev.find((i) => i.id === id && i.type === "news");
        if (item) originalNewsItem = { ...item };

        return prev.map((item) => {
          if (item.id === id && item.type === "news") {
            const isCurrentlyLiked = (item as NewsItemWithState).isLiked;
            const currentLikes = item.like_count ?? 0;
            return {
              ...item,
              isLiked: !isCurrentlyLiked,
              like_count: !isCurrentlyLiked
                ? currentLikes + 1
                : Math.max(0, currentLikes - 1),
            };
          }
          return item;
        });
      });

      try {
        await handleNewsLikeToggle(id);
      } catch (error) {
        console.error("Profile like toggle failed:", error);

        if (originalNewsItem) {
          setMyBookmarks((prev) =>
            prev.map((item) =>
              item.id === id && item.type === "news" ? originalNewsItem! : item
            )
          );
        }
      }
    },
    [handleNewsLikeToggle, currentUserId]
  );

  return (
    <>
      <div className="relative">
        <ProfileHeader
          profile={localProfile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          onAvatarClick={() => isOwnProfile && setIsEditImgOpen(true)}
          onEditClick={() => isOwnProfile && setIsEditProfileOpen(true)}
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
        profile={localProfile}
        action={updateProfile}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <ImgEditModal
        profile={localProfile}
        action={updateAvatarUrl}
        isOpen={isEditImgOpen}
        onClose={() => setIsEditImgOpen(false)}
      />
    </>
  );
}
