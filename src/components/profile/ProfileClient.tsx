/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../common/toast/ToastContext";

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

export default function ProfileClient({
  profile,
  currentUserId,
  targetUserId,
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
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { showToast } = useToast();
  // [✅ 추가] 탭 상태 관리 (URL 이동 없이 즉시 전환)
  const [activeTab, setActiveTab] = useState<TabKey>(
    (initialTab as TabKey) || "posts"
  );

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    // URL을 얕은 변경(Shallow routing)으로 업데이트하여 새로고침 시에도 상태 유지
    window.history.replaceState(null, "", `?tab=${tab}&userId=${targetUserId}`);
  };

  const {
    handleLikeToggle: handleNewsLikeToggle,
    handleBookmarkToggle: handleNewsBookmarkToggle,
  } = useNewsFeedContext();

  const { isFollowing: isFollowingFromContext, toggleFollow } = useFollow();
  const isOwnProfile = currentUserId === targetUserId;
  const isFollowing = isFollowingFromContext(targetUserId);

  // [✅ React Query 적용] 1. 프로필 데이터
  // 프로필은 실시간 업데이트 빈도가 낮고 로컬 state로도 충분하지만 일관성을 위해 state 유지
  const [localProfile, setLocalProfile] = useState<Profile>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile, targetUserId]);

  // [✅ React Query 적용] 2. 내 게시글 (My Posts)
  const { data: myPosts = [] } = useQuery({
    queryKey: ["profile", "posts", targetUserId],
    initialData: initialMyPosts,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id (
            display_name,
            email,
            avatar_url,
            equipped_badge_id
          ),
          user_post_likes!left(user_id),
          user_post_bookmarks!left(user_id)
        `
        )
        .eq("user_id", targetUserId)
        .eq(
          "user_post_likes.user_id",
          currentUserId || "00000000-0000-0000-0000-000000000000"
        )
        .eq(
          "user_post_bookmarks.user_id",
          currentUserId || "00000000-0000-0000-0000-000000000000"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 데이터 매핑
      return (data as any[]).map((item) => ({
        id: item.id,
        title: item.title || "",
        content: item.content,
        created_at: item.created_at || "",
        post_type: item.post_type || "",
        hashtags: item.hashtags || [],
        like_count: item.like_count || 0,
        comment_count: item.comment_count || 0,
        view_count: item.view_count || 0,
        user_id: item.user_id || "",
        model: item.model || undefined,
        result_mode: item.result_mode || undefined,
        thumbnail: item.thumbnail || "",
        subtitle: item.subtitle || "",
        isLiked: !!(item.user_post_likes && item.user_post_likes.length > 0),
        isBookmarked: !!(
          item.user_post_bookmarks && item.user_post_bookmarks.length > 0
        ),
        profiles: item.profiles
          ? {
              display_name: item.profiles.display_name,
              email: item.profiles.email,
              avatar_url: item.profiles.avatar_url,
              equipped_badge_id: item.profiles.equipped_badge_id,
            }
          : undefined,
      })) as PostType[];
    },
  });

  // [✅ React Query 적용] 3. 내 댓글 (My Comments)
  const { data: myComments = [] } = useQuery({
    queryKey: ["profile", "comments", targetUserId],
    initialData: initialMyComments.map((c) => ({
      ...c,
      isLiked: !!(c.comment_likes && c.comment_likes.length > 0),
    })),
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          comment_likes!left(user_id)
        `
        )
        .eq("user_id", targetUserId)
        .eq(
          "comment_likes.user_id",
          currentUserId || "00000000-0000-0000-0000-000000000000"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as any[]).map((c) => ({
        ...c,
        isLiked: !!(c.comment_likes && c.comment_likes.length > 0),
      })) as DbCommentRow[];
    },
  });

  // [✅ React Query 적용] 4. 북마크 (Bookmarks) - 초기 데이터 가공
  const initialBookmarksCombined = useMemo(() => {
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

  const { data: myBookmarks = [] } = useQuery({
    queryKey: ["profile", "bookmarks", targetUserId],
    initialData: initialBookmarksCombined,
    staleTime: Infinity,
    queryFn: async () => {
      // 북마크된 게시글과 뉴스를 각각 조회 후 병합
      const [postsResult, newsResult] = await Promise.all([
        // 게시글 북마크 조회
        supabase
          .from("user_post_bookmarks")
          .select(
            `
            posts (
              *,
              profiles:user_id (
                display_name,
                email,
                avatar_url,
                equipped_badge_id
              ),
              user_post_likes!left(user_id)
            )
          `
          )
          .eq("user_id", targetUserId)
          .eq(
            "posts.user_post_likes.user_id",
            currentUserId || "00000000-0000-0000-0000-000000000000"
          )
          .order("created_at", { ascending: false, foreignTable: "posts" }),

        // 뉴스 북마크 조회
        supabase
          .from("user_news_bookmarks")
          .select(
            `
            news ( 
              *, 
              user_news_likes!left(user_id) 
            )
          `
          )
          .eq("user_id", targetUserId)
          .eq(
            "news.user_news_likes.user_id",
            currentUserId || "00000000-0000-0000-0000-000000000000"
          )
          .order("created_at", { ascending: false, foreignTable: "news" }),
      ]);

      if (postsResult.error) throw postsResult.error;
      if (newsResult.error) throw newsResult.error;

      const posts = (postsResult.data || [])
        .map((item) => item.posts as any)
        .filter(Boolean)
        .map((item) => ({
          id: item.id,
          title: item.title || "",
          content: item.content,
          created_at: item.created_at || "",
          post_type: item.post_type || "",
          hashtags: item.hashtags || [],
          like_count: item.like_count || 0,
          comment_count: item.comment_count || 0,
          view_count: item.view_count || 0,
          user_id: item.user_id || "",
          model: item.model || undefined,
          result_mode: item.result_mode || undefined,
          thumbnail: item.thumbnail || "",
          subtitle: item.subtitle || "",
          isLiked: !!(item.user_post_likes && item.user_post_likes.length > 0),
          isBookmarked: true, // 북마크 목록이므로 true
          type: "post" as const,
          profiles: item.profiles
            ? {
                display_name: item.profiles.display_name,
                email: item.profiles.email,
                avatar_url: item.profiles.avatar_url,
                equipped_badge_id: item.profiles.equipped_badge_id,
              }
            : undefined,
        }));

      const news = (newsResult.data || [])
        .map((item) => item.news as any)
        .filter(Boolean)
        .map((item) => ({
          ...item,
          type: "news" as const,
          isLiked: !!(item.user_news_likes && item.user_news_likes.length > 0),
          isBookmarked: true, // 북마크 목록이므로 true
        }));

      return [...posts, ...news].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      ) as BookmarkedItem[];
    },
  });

  const bookmarkedNewsIds = useMemo(
    () =>
      myBookmarks
        .filter((item) => item.type === "news")
        .map((item) => `${item.id}`),
    [myBookmarks]
  );

  // [✅ 핸들러 수정] 팔로우 토글
  const handleFollowToggle = useCallback(async () => {
    if (currentUserId === targetUserId) return;

    try {
      await toggleFollow(targetUserId);
    } catch (error) {
      console.error("Follow toggle failed:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        showToast({
          title: "팔로우 오류",
          message: "팔로우 처리 중 오류가 발생했습니다.",
          variant: "error",
        });
      }
    }
  }, [toggleFollow, currentUserId, targetUserId]);

  // [✅ 핸들러 수정] 게시글 좋아요 토글 (Optimistic Update)
  const handlePostLikeToggle = useCallback(
    async (id: string) => {
      if (!currentUserId) return;

      const queryKey = ["profile", "posts", targetUserId];
      const bookmarkQueryKey = ["profile", "bookmarks", targetUserId];

      // 1. Snapshot
      const previousPosts = queryClient.getQueryData<PostType[]>(queryKey);
      const previousBookmarks =
        queryClient.getQueryData<BookmarkedItem[]>(bookmarkQueryKey);

      // 2. Optimistic Update for Posts
      queryClient.setQueryData(
        queryKey,
        (old: PostType[] | undefined) =>
          old?.map((post) => {
            if (post.id === id) {
              const isLiked = !post.isLiked;
              return {
                ...post,
                isLiked,
                like_count: isLiked
                  ? (post.like_count ?? 0) + 1
                  : Math.max(0, (post.like_count ?? 0) - 1),
              };
            }
            return post;
          }) ?? []
      );

      // 3. Optimistic Update for Bookmarks (if post is in bookmarks)
      queryClient.setQueryData(
        bookmarkQueryKey,
        (old: BookmarkedItem[] | undefined) =>
          old?.map((item) => {
            if (item.type === "post" && item.id === id) {
              const isLiked = !item.isLiked;
              return {
                ...item,
                isLiked,
                like_count: isLiked
                  ? (item.like_count ?? 0) + 1
                  : Math.max(0, (item.like_count ?? 0) - 1),
              };
            }
            return item;
          }) ?? []
      );

      // 4. DB Request
      try {
        const targetPost = previousPosts?.find((p) => p.id === id);
        // 북마크 탭에서만 있는 경우도 고려
        const targetBookmark = previousBookmarks?.find(
          (b) => b.type === "post" && b.id === id
        );
        const isCurrentlyLiked =
          targetPost?.isLiked ?? targetBookmark?.isLiked ?? false;

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
        // 5. Rollback on Error
        if (previousPosts) queryClient.setQueryData(queryKey, previousPosts);
        if (previousBookmarks)
          queryClient.setQueryData(bookmarkQueryKey, previousBookmarks);
      }
    },
    [currentUserId, targetUserId, queryClient, supabase]
  );

  // [✅ 핸들러 수정] 게시글 북마크 토글 (Optimistic Update)
  const handlePostBookmarkToggle = useCallback(
    async (id: string) => {
      if (!currentUserId) return;

      const postsKey = ["profile", "posts", targetUserId];
      const bookmarksKey = ["profile", "bookmarks", targetUserId];

      const previousPosts = queryClient.getQueryData<PostType[]>(postsKey);
      const previousBookmarks =
        queryClient.getQueryData<BookmarkedItem[]>(bookmarksKey);

      // Optimistic Update: Posts List (isBookmarked toggle)
      queryClient.setQueryData(
        postsKey,
        (old: PostType[] | undefined) =>
          old?.map((post) =>
            post.id === id
              ? { ...post, isBookmarked: !post.isBookmarked }
              : post
          ) ?? []
      );

      // 4. DB Request
      try {
        const targetPost = previousPosts?.find((p) => p.id === id);
        const isCurrentlyBookmarked = targetPost?.isBookmarked ?? false;

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
        if (previousPosts) queryClient.setQueryData(postsKey, previousPosts);
        if (previousBookmarks)
          queryClient.setQueryData(bookmarksKey, previousBookmarks);
      }
    },
    [currentUserId, targetUserId, queryClient, togglePostBookmark]
  );

  // [✅ 핸들러 수정] 댓글 좋아요 토글
  const handleCommentLikeToggle = useCallback(
    async (id: string) => {
      if (!currentUserId) return;

      const commentsKey = ["profile", "comments", targetUserId];
      const previousComments =
        queryClient.getQueryData<DbCommentRow[]>(commentsKey);

      // Optimistic Update
      queryClient.setQueryData(
        commentsKey,
        (old: DbCommentRow[] | undefined) =>
          old?.map((comment) => {
            if (comment.id === id) {
              const isLiked = !comment.isLiked;
              return {
                ...comment,
                isLiked,
                like_count: isLiked
                  ? (comment.like_count ?? 0) + 1
                  : Math.max(0, (comment.like_count ?? 0) - 1),
              };
            }
            return comment;
          }) ?? []
      );

      try {
        const targetComment = previousComments?.find((c) => c.id === id);
        const isCurrentlyLiked = targetComment?.isLiked ?? false;

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
        if (previousComments)
          queryClient.setQueryData(commentsKey, previousComments);
      }
    },
    [currentUserId, targetUserId, queryClient, supabase]
  );

  // [✅ 핸들러 수정] 북마크 탭에서의 토글 (뉴스/포스트 분기)
  const handleProfileBookmarkToggle = useCallback(
    async (id: string, type: "post" | "news") => {
      if (!currentUserId) return;

      const bookmarksKey = ["profile", "bookmarks", targetUserId];
      const previousBookmarks =
        queryClient.getQueryData<BookmarkedItem[]>(bookmarksKey);

      // Optimistic Update: 리스트에서 제거
      queryClient.setQueryData(
        bookmarksKey,
        (old: BookmarkedItem[] | undefined) =>
          old?.filter((item) => item.id !== id) ?? []
      );

      try {
        if (type === "news") {
          await handleNewsBookmarkToggle(id);
        } else {
          const result = await togglePostBookmark(id, currentUserId, true); // true means currently bookmarked, so remove it
          if (!result.success) {
            throw new Error(result.error ?? "포스트 북마크 해제 실패");
          }
        }
      } catch (error) {
        console.error("북마크 토글 실패:", error);
        if (previousBookmarks)
          queryClient.setQueryData(bookmarksKey, previousBookmarks);
      }
    },
    [
      currentUserId,
      targetUserId,
      queryClient,
      handleNewsBookmarkToggle,
      togglePostBookmark,
    ]
  );

  // [✅ 핸들러 수정] 뉴스 좋아요 토글
  const handleProfileNewsLikeToggle = useCallback(
    async (id: string) => {
      if (!currentUserId) return;

      const bookmarksKey = ["profile", "bookmarks", targetUserId];
      const previousBookmarks =
        queryClient.getQueryData<BookmarkedItem[]>(bookmarksKey);

      queryClient.setQueryData(
        bookmarksKey,
        (old: BookmarkedItem[] | undefined) =>
          old?.map((item) => {
            if (item.id === id && item.type === "news") {
              const isLiked = !item.isLiked;
              return {
                ...item,
                isLiked,
                like_count: isLiked
                  ? (item.like_count ?? 0) + 1
                  : Math.max(0, (item.like_count ?? 0) - 1),
              };
            }
            return item;
          }) ?? []
      );

      try {
        await handleNewsLikeToggle(id);
      } catch (error) {
        console.error("Profile news like toggle failed:", error);
        if (previousBookmarks)
          queryClient.setQueryData(bookmarksKey, previousBookmarks);
      }
    },
    [currentUserId, targetUserId, queryClient, handleNewsLikeToggle]
  );

  // [✅ Realtime 구독] setQueryData 기반으로 변경
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
          const newProfileData = payload.new as Profile;
          setLocalProfile(
            (prev) =>
              ({
                ...prev,
                ...newProfileData,
              } as Profile)
          );
        }
      );

      // 2. posts
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `user_id=eq.${targetUserId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: fullPostData, error } = await supabase
              .from("posts")
              .select(
                `*, profiles:user_id (display_name, email, avatar_url, equipped_badge_id)`
              )
              .eq("id", payload.new.id)
              .single();

            if (!error && fullPostData) {
              queryClient.setQueryData(
                ["profile", "posts", targetUserId],
                (old: PostType[] = []) => [fullPostData as PostType, ...old]
              );
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedPost = payload.new as PostType;
            queryClient.setQueryData(
              ["profile", "posts", targetUserId],
              (old: PostType[] = []) =>
                old.map((p) =>
                  p.id === updatedPost.id
                    ? {
                        ...p,
                        like_count: updatedPost.like_count,
                        view_count: updatedPost.view_count,
                      }
                    : p
                )
            );
            // 북마크 리스트 내의 포스트도 업데이트
            queryClient.setQueryData(
              ["profile", "bookmarks", targetUserId],
              (old: BookmarkedItem[] = []) =>
                old.map((item) =>
                  item.type === "post" && item.id === updatedPost.id
                    ? { ...item, like_count: updatedPost.like_count }
                    : item
                )
            );
          } else if (payload.eventType === "DELETE") {
            const oldId = payload.old.id;
            queryClient.setQueryData(
              ["profile", "posts", targetUserId],
              (old: PostType[] = []) => old.filter((p) => p.id !== oldId)
            );
            queryClient.setQueryData(
              ["profile", "bookmarks", targetUserId],
              (old: BookmarkedItem[] = []) =>
                old.filter(
                  (item) => !(item.type === "post" && item.id === oldId)
                )
            );
          }
        }
      );

      // 3. comments
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newComment = payload.new as DbCommentRow;
            queryClient.setQueryData(
              ["profile", "comments", targetUserId],
              (old: DbCommentRow[] = []) => [
                { ...newComment, isLiked: false },
                ...old,
              ]
            );
          } else if (payload.eventType === "UPDATE") {
            const updatedComment = payload.new as DbCommentRow;
            queryClient.setQueryData(
              ["profile", "comments", targetUserId],
              (old: DbCommentRow[] = []) =>
                old.map((c) =>
                  c.id === updatedComment.id
                    ? {
                        ...c,
                        like_count: updatedComment.like_count,
                        reply_count: updatedComment.reply_count,
                      }
                    : c
                )
            );
          } else if (payload.eventType === "DELETE") {
            queryClient.setQueryData(
              ["profile", "comments", targetUserId],
              (old: DbCommentRow[] = []) =>
                old.filter((c) => c.id !== payload.old.id)
            );
          }
        }
      );

      // 4. user_post_bookmarks (북마크 실시간)
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_post_bookmarks",
          filter: `user_id=eq.${targetUserId}`,
        },
        async (payload) => {
          const newBookmark = payload.new as { post_id: string };
          const { data: postData, error } = await supabase
            .from("posts")
            .select(
              "*, user_post_likes(user_id), profiles:user_id(avatar_url, display_name, email, equipped_badge_id)"
            )
            .eq("id", newBookmark.post_id)
            .single();

          if (!error && postData) {
            const postToAdd: PostType & { type: "post" } = {
              ...(postData as PostType),
              isLiked: !!(
                postData.user_post_likes && postData.user_post_likes.length > 0
              ),
              isBookmarked: true,
              type: "post" as const,
            };

            queryClient.setQueryData(
              ["profile", "bookmarks", targetUserId],
              (old: BookmarkedItem[] = []) => [postToAdd, ...old]
            );
            queryClient.setQueryData(
              ["profile", "posts", targetUserId],
              (old: PostType[] = []) =>
                old.map((p) =>
                  p.id === newBookmark.post_id
                    ? { ...p, isBookmarked: true }
                    : p
                )
            );
          }
        }
      );

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
          queryClient.setQueryData(
            ["profile", "bookmarks", targetUserId],
            (old: BookmarkedItem[] = []) =>
              old.filter(
                (item) =>
                  !(item.type === "post" && item.id === oldBookmark.post_id)
              )
          );
          queryClient.setQueryData(
            ["profile", "posts", targetUserId],
            (old: PostType[] = []) =>
              old.map((p) =>
                p.id === oldBookmark.post_id ? { ...p, isBookmarked: false } : p
              )
          );
        }
      );

      channel.subscribe();
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [targetUserId, currentUserId, supabase, queryClient, bookmarkedNewsIds]);

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
          activeTab={activeTab} // [✅ 수정] State 전달
          onTabChange={handleTabChange} // [✅ 수정] 핸들러 전달
          myPosts={myPosts} // [✅ 수정] React Query 데이터 전달
          myComments={myComments} // [✅ 수정] React Query 데이터 전달
          myBookmarks={myBookmarks} // [✅ 수정] React Query 데이터 전달
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
