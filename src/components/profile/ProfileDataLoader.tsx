import { createClient } from "@/utils/supabase/server";
import { FormState, NewsRow, Profile } from "@/types";
import { Database } from "@/utils/supabase/supabase";
import ProfileClient from "./ProfileClient";
import { redirect } from "next/navigation";
import { PostType } from "@/types/Post";

type DbPostRow = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles?: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  user_post_likes?: { user_id: string }[] | null;
  user_post_bookmarks?: { user_id: string }[] | null;
};

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
  comment_likes?: { user_id: string }[] | null;
};

type BookmarkedNewsRow = NewsRow & {
  user_news_likes: { user_id: string }[] | null;
};

type BookmarkedPostRow = {
  posts:
    | (DbPostRow & {
        profiles?: {
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
        } | null;
        user_post_likes?: { user_id: string }[] | null;
      })
    | null;
};

function dbPostToPostType(dbPost: DbPostRow): PostType {
  return {
    id: dbPost.id,
    title: dbPost.title ?? "제목 없음",
    content: dbPost.content ?? null,
    created_at: dbPost.created_at ?? new Date().toISOString(),
    post_type: dbPost.post_type ?? "free",
    hashtags: dbPost.hashtags ?? [],
    like_count: dbPost.like_count ?? 0,
    comment_count: dbPost.comment_count ?? 0,
    view_count: dbPost.view_count ?? 0,
    model:
      (dbPost.model as "GPT" | "Gemini" | "텍스트" | "이미지") ?? undefined,
    user_id: dbPost.user_id ?? "",
    isLiked: !!(dbPost.user_post_likes && dbPost.user_post_likes.length > 0),
    isBookmarked: !!(
      dbPost.user_post_bookmarks && dbPost.user_post_bookmarks.length > 0
    ),
    profiles: dbPost.profiles
      ? {
          display_name: dbPost.profiles.display_name ?? null,
          email: dbPost.profiles.email ?? null,
          avatar_url: dbPost.profiles.avatar_url ?? null,
        }
      : undefined,
  };
}

type ProfileDataLoaderProps = {
  userId: string;
  targetUserId: string;
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
  toggleFollow: (targetId: string) => Promise<{ success: boolean }>;
};

export default async function ProfileDataLoader({
  userId,
  targetUserId,
  initialTab,
  updateProfile,
  updateAvatarUrl,
  togglePostBookmark,
}: ProfileDataLoaderProps) {
  const supabase = await createClient();

  console.log("=== ProfileDataLoader Debug ===");
  console.log("로그인 유저 ID:", userId);
  console.log("타겟 유저 ID:", targetUserId);
  console.log("본인 프로필?", userId === targetUserId);

  const [
    profileResult,
    bookmarkedNewsResult,
    myPostsResult,
    bookmarkedPostsResult,
    myCommentsResult,
    // ⭐️ 팔로우 상태 직접 확인
    followStatusResult,
  ] = await Promise.all([
    // 타겟 유저 프로필
    supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single() as unknown as Promise<{ data: Profile; error: unknown }>,

    // 북마크한 뉴스
    supabase
      .from("user_news_bookmarks")
      .select(`news ( *, user_news_likes!left(user_id) )`)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false, foreignTable: "news" }),

    // 타겟 유저 게시글
    supabase
      .from("posts")
      .select(
        `
      *,
      profiles:user_id (
        display_name,
        email,
        avatar_url
      ),
      user_post_likes!left(user_id),
      user_post_bookmarks!left(user_id)
    `
      )
      .eq("user_id", targetUserId)
      .eq("user_post_likes.user_id", userId)
      .eq("user_post_bookmarks.user_id", userId)
      .order("created_at", { ascending: false }),

    // 타겟 유저가 북마크한 게시글
    supabase
      .from("user_post_bookmarks")
      .select(
        `
      posts (
        *,
        profiles:user_id (
          display_name,
          email,
          avatar_url
        ),
        user_post_likes!left(user_id)
      )
    `
      )
      .eq("user_id", targetUserId)
      .eq("posts.user_post_likes.user_id", userId)
      .order("created_at", { ascending: false, foreignTable: "posts" }),

    // 타겟 유저 댓글
    supabase
      .from("comments")
      .select(
        `
      *,
      comment_likes!left(user_id)
    `
      )
      .eq("user_id", targetUserId)
      .eq("comment_likes.user_id", userId)
      .order("created_at", { ascending: false }),

    // ⭐️ 팔로우 상태 확인 (본인이 아닐 때만)
    userId !== targetUserId
      ? supabase
          .from("follows")
          .select("id")
          .eq("follower_id", userId)
          .eq("following_id", targetUserId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const profile = profileResult.data;
  if (!profile) {
    console.error("Profile fetch error:", profileResult.error);
    redirect("/");
  }

  const bookmarkedNews: BookmarkedNewsRow[] =
    bookmarkedNewsResult.data
      ?.map((item) => item.news as BookmarkedNewsRow)
      .filter(Boolean) || [];
  if (bookmarkedNewsResult.error) {
    console.error(
      "Bookmarked News fetch error:",
      bookmarkedNewsResult.error.message
    );
  }

  const myPosts: PostType[] =
    (myPostsResult.data as DbPostRow[] | null)?.map((p) =>
      dbPostToPostType(p)
    ) || [];
  if (myPostsResult.error) {
    console.error("My Posts fetch error:", myPostsResult.error.message);
  }

  const bookmarkedPosts: PostType[] =
    (bookmarkedPostsResult.data as BookmarkedPostRow[] | null)
      ?.map((item) => item.posts)
      .filter(Boolean)
      .map((p) => {
        const post = dbPostToPostType(p as DbPostRow);
        return { ...post, isBookmarked: true };
      }) || [];

  const myComments = (myCommentsResult.data as DbCommentRow[] | null) || [];
  if (myCommentsResult.error) {
    console.error("My Comments fetch error:", myCommentsResult.error.message);
  }

  // ⭐️ 팔로우 상태 결정
  const isFollowing =
    userId !== targetUserId ? !!followStatusResult.data : false;

  return (
    <ProfileClient
      profile={profile}
      currentUserId={userId}
      targetUserId={targetUserId}
      isFollowing={isFollowing} // ✅ 실제 팔로우 상태 전달
      initialTab={initialTab}
      updateProfile={updateProfile}
      updateAvatarUrl={updateAvatarUrl}
      togglePostBookmark={togglePostBookmark}
      initialMyPosts={myPosts}
      initialBookmarkedPosts={bookmarkedPosts}
      initialBookmarkedNews={bookmarkedNews}
      initialMyComments={myComments}
    />
  );
}
