"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteAllHistoryAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("user_post_views")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("deleteAllHistoryAction 오류:", error);
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/history");

  return { success: true };
}
