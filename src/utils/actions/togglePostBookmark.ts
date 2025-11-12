"use server";

import { createClient } from "@/utils/supabase/server";

export async function togglePostBookmark(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  // 이미 북마크한 글인지 확인
  const { data: existing } = await supabase
    .from("user_post_bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    // 북마크 해제
    await supabase
      .from("user_post_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    // 북마크 추가
    await supabase
      .from("user_post_bookmarks")
      .insert({ user_id: user.id, post_id: postId });
  }
}
