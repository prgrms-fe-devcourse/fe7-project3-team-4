"use server";

import { createClient } from "@/utils/supabase/server";

export async function togglePostLike(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: likeData } = await supabase
    .from("user_post_likes")
    .select("*")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .single();

  if (likeData) {
    await supabase.rpc("decrement_like_count", { post_id: postId });
    await supabase
      .from("user_post_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    await supabase.rpc("increment_like_count", { post_id: postId });
    await supabase
      .from("user_post_likes")
      .insert({ user_id: user.id, post_id: postId });
  }
}
