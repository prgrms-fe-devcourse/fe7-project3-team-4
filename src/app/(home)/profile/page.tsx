// src/app/(home)/profile/page.tsx
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { FormState } from "@/types";
import { revalidatePath } from "next/cache";
import ProfileDataLoader from "@/components/profile/ProfileDataLoader";
import ProfilePageSkeleton from "@/components/profile/loading/ProfilePageSkeleton";

// ✅ 서버 액션을 컴포넌트 외부로 이동하고 독립적으로 만듦

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

// ✅ checkFollowStatus 호출을 제거하고 독립적으로 구현
async function toggleFollow(targetId: string): Promise<{ success: boolean }> {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false };
  }

  // 내부에서 바로 확인
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .single();

  if (existing) {
    // 언팔로우
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
    if (error) throw error;
  } else {
    // 팔로우
    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetId,
    });
    if (error) throw error;
  }

  revalidatePath("/profile", "page");
  return { success: true };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; userId?: string }>;
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
  const targetUserId = search.userId || user.id;
  const initialTab = search.tab || "posts";

  return (
    <section className="relative max-w-2xl mx-auto">
      <Suspense fallback={<ProfilePageSkeleton />}>
        <ProfileDataLoader
          userId={user.id}
          targetUserId={targetUserId}
          initialTab={initialTab}
          updateProfile={updateProfile}
          updateAvatarUrl={updateAvatarUrl}
          togglePostBookmark={togglePostBookmark}
          toggleFollow={toggleFollow}
        />
      </Suspense>
    </section>
  );
}
