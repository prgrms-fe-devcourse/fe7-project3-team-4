// src/components/profile/ProfileDataLoader.tsx

import { createClient } from "@/utils/supabase/server";
import { FormState, NewsRow, Post, Profile } from "@/types";
import { Database } from "@/utils/supabase/supabase";
import ProfilePageClient from "./ProfilePageClient";
import { redirect } from "next/navigation";

type DbPostRow = Database["public"]["Tables"]["posts"]["Row"];

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
};

type BookmarkedNewsRow = NewsRow & {
  user_news_likes: { user_id: string }[] | null;
};
type BookmarkedPostRow = { posts: DbPostRow | null };

function dbPostToPostType(
  dbPost: DbPostRow,
): Post {
  return {
  id: dbPost.id,
  comment_count: dbPost.comment_count ?? 0,
  content: dbPost.content ? String(dbPost.content) : "",
  created_at: dbPost.created_at ?? new Date().toISOString(),
  like_count: dbPost.like_count ?? 0,
  post_type: (dbPost.post_type as "prompt" | "free" | "weekly") ?? "free",
  title: dbPost.title ?? "제목 없음",
  user_id: dbPost.user_id ?? "",
  view_count: dbPost.view_count ?? 0,
  email: dbPost.email ?? "이메일 없음",
  hashtags: dbPost.hashtags ?? [],
  model: (dbPost.model as "GPT" | "Gemini" | "텍스트" | "이미지") ?? undefined,
  updated_at: dbPost.updated_at ?? new Date().toISOString(),
};
}

type ProfileDataLoaderProps = {
  userId: string;
  initialTab: string; 
  updateProfile: (prevState: FormState, formData: FormData) => Promise<FormState>;
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

    supabase
      .from("user_news_bookmarks")
      .select(`news ( *, user_news_likes!left(user_id) )`)
      .eq("user_id", userId)
      .eq("news.user_news_likes.user_id", userId)
      .order("created_at", { ascending: false, foreignTable: "news" }),

    supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("user_post_bookmarks")
      .select("posts ( * )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false, foreignTable: "posts" }),

    supabase
      .from("comments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  ]);

  const profile = profileResult.data;
  if (profileResult.error && !profile) {
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

  const myPosts: Post[] =
    (myPostsResult.data as DbPostRow[] | null)?.map((p) =>
      dbPostToPostType(p)
    ) || [];
  if (myPostsResult.error) {
    console.error("My Posts fetch error:", myPostsResult.error.message);
  }

  const bookmarkedPosts: Post[] =
    (bookmarkedPostsResult.data as BookmarkedPostRow[] | null)
      ?.map((item) => item.posts)
      .filter(Boolean)
      .map((p) => dbPostToPostType(p as DbPostRow)) || [];
  if (bookmarkedPostsResult.error) {
    console.error(
      "Bookmarked Posts fetch error:",
      bookmarkedPostsResult.error.message
    );
  }

  const myComments = (myCommentsResult.data as DbCommentRow[] | null) || [];
  if (myCommentsResult.error) {
    console.error("My Comments fetch error:", myCommentsResult.error.message);
  }

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