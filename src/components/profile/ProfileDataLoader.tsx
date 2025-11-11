// src/components/profile/ProfileDataLoader.tsx

import { createClient } from "@/utils/supabase/server";
import { FormState, NewsRow, Post, Profile } from "@/types";
import { Database } from "@/utils/supabase/supabase";
import ProfilePageClient from "./ProfilePageClient";
import { redirect } from "next/navigation";
import { PostType } from "@/types/Post";

type DbPostRow = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles?: { display_name: string | null; email: string | null; avatar_url: string | null;} | null;
};

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
};

type BookmarkedNewsRow = NewsRow & {
  user_news_likes: { user_id: string }[] | null;
};

type BookmarkedPostRow = {
  posts:
    | (DbPostRow & {
        profiles?: { display_name: string | null; email: string | null; avatar_url: string | null; } | null;
      })
    | null;
};

// 🔧 posts 테이블 데이터를 Post 타입으로 변환
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

    // profiles join 결과 반영
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
};

export default async function ProfileDataLoader({
  userId,
  initialTab,
  updateProfile,
  updateAvatarUrl,
  togglePostBookmark,
}: ProfileDataLoaderProps) {
  const supabase = await createClient();

  const [
    profileResult,
    bookmarkedNewsResult,
    myPostsResult,
    bookmarkedPostsResult,
    myCommentsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single() as unknown as Promise<{ data: Profile; error: unknown }>,

    // ✅ 그대로 유지 (정상 동작 버전)
    supabase
      .from("user_news_bookmarks")
      .select(`news ( *, user_news_likes!left(user_id) )`)
      .eq("user_id", userId)
      .eq("news.user_news_likes.user_id", userId)
      .order("created_at", { ascending: false, foreignTable: "news" }),

    // ✅ 내 게시글: profiles join 추가
    supabase
      .from("posts")
      .select(
        `
      *,
      profiles:user_id (
        display_name,
        email,
        avatar_url
      )
    `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    // ✅ 북마크한 게시글: posts와 profiles 둘 다 join
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
        )
      )
    `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false, foreignTable: "posts" }),

    supabase
      .from("comments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  // ⚠️ 프로필 확인
  const profile = profileResult.data;
  if (profileResult.error && !profile) {
    console.error("Profile fetch error:", profileResult.error);
    redirect("/");
  }

  // 북마크한 뉴스 데이터 정제
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

  // 내 게시글 데이터 정제
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
      .map((p) => dbPostToPostType(p as DbPostRow)) || [];

  // 내 댓글 데이터 정제
  const myComments = (myCommentsResult.data as DbCommentRow[] | null) || [];
  if (myCommentsResult.error) {
    console.error("My Comments fetch error:", myCommentsResult.error.message);
  }

  // ✅ 클라이언트 컴포넌트로 전달
  return (
    <ProfilePageClient
      profile={profile}
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
