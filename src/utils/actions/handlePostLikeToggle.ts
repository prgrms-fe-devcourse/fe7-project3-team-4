"use server";

import { createClient } from "@/utils/supabase/server"; // 너가 만든 함수 사용

export async function handlePostLikeToggle(postId: string) {
  const supabase = await createClient();

  // 1. 로그인된 유저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 2. 이미 좋아요한 게시글인지 확인
  const { data: liked } = await supabase
    .from("user_post_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  try {
    if (liked) {
      // 좋아요 취소
      await supabase.rpc("decrement_like_count", { post_id: postId });
      await supabase
        .from("user_post_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      return { success: true, liked: false };
    } else {
      // 좋아요 추가
      await supabase.rpc("increment_like_count", { post_id: postId });
      await supabase
        .from("user_post_likes")
        .insert({ user_id: user.id, post_id: postId });

      return { success: true, liked: true };
    }
  } catch (err) {
    console.error(err);
    return { error: "좋아요 처리 중 오류가 발생했습니다." };
  }
}
