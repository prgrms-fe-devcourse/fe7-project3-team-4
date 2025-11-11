"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * 게시글 북마크 상태를 토글하는 서버 액션
 * @param postId - 북마크할 게시글의 ID
 * @returns { liked: boolean } 새 북마크 상태
 */
export async function handlePostBookmarkToggle(postId: string) {
  const supabase = await createClient();

  // 1. 로그인된 유저 정보 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 2. 현재 북마크 여부 확인
  const { data: existingBookmark, error: fetchError } = await supabase
    .from("user_post_bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (fetchError) {
    console.error(fetchError);
    return { error: "북마크 상태를 불러오지 못했습니다." };
  }

  try {
    if (existingBookmark) {
      // 3-1. 이미 북마크된 경우 → 삭제
      const { error } = await supabase
        .from("user_post_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (error) throw error;

      return { success: true, bookmarked: false };
    } else {
      // 3-2. 북마크되지 않은 경우 → 추가
      const { error } = await supabase
        .from("user_post_bookmarks")
        .insert({ user_id: user.id, post_id: postId });

      if (error && error.code !== "23505") throw error;

      return { success: true, bookmarked: true };
    }
  } catch (err) {
    console.error(err);
    return { error: "북마크 처리 중 오류가 발생했습니다." };
  }
}
