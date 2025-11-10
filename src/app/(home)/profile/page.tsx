// src/app/(home)/profile/page.tsx
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { FormState } from "@/types";
import { revalidatePath } from "next/cache";
import ProfileDataLoader from "@/components/profile/ProfileDataLoader";

import ProfilePageSkeleton from "@/components/profile/ProfilePageSkeleton";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const search = await searchParams;

  const initialTab = search.tab || "posts";

  async function updateProfile(
    prevState: FormState,
    formData: FormData
  ): Promise<FormState> {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      return { success: false, error: "로그인이 필요합니다." };
    }
    const displayName = formData.get("display_name")?.toString() ?? "";
    const bio = formData.get("bio")?.toString() ?? "";
    const { error: updateErrors } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio: bio })
      .eq("id", user.id);

    if (updateErrors) {
      return { success: false, error: "프로필 저장 중 문제가 발생했습니다." };
    }
    revalidatePath("/profile", "page");
    return { success: true, error: null };
  }

  async function updateAvatarUrl(url: string): Promise<FormState> {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      return { success: false, error: "로그인이 필요합니다." };
    }
    const { error: updateErrors } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);
    if (updateErrors) {
      return {
        success: false,
        error: "아바타 URL 저장 중 문제가 발생했습니다.",
      };
    }
    revalidatePath("/profile", "page");
    return { success: true, error: null };
  }

  async function togglePostBookmark(
    postId: string,
    currentUserId: string,
    isBookmarked: boolean
  ): Promise<FormState> {
    "use server";
    const supabase = await createClient();

    if (isBookmarked) {
      const { error } = await supabase
        .from("user_post_bookmarks")
        .delete()
        .eq("user_id", currentUserId)
        .eq("post_id", postId);
      if (error) {
        return { success: false, error: "북마크 제거 실패" };
      }
    } else {
      const { error } = await supabase
        .from("user_post_bookmarks")
        .insert({ user_id: currentUserId, post_id: postId });
      if (error) {
        return { success: false, error: "북마크 추가 실패" };
      }
    }
    revalidatePath("/profile", "page");
    return { success: true, error: null };
  }

  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfileDataLoader
        userId={user.id}
        initialTab={initialTab}
        updateProfile={updateProfile}
        updateAvatarUrl={updateAvatarUrl}
        togglePostBookmark={togglePostBookmark}
      />
    </Suspense>
  );
}
