// /history/page.tsx 또는 HistoryPostForm.tsx

import { createClient } from "@/utils/supabase/server";
import HistoryPost from "./HistoryPost";
import { ViewHistoryType } from "@/types/Post"; // [★] 새 타입 import

export default async function HistoryPostForm() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div>로그인이 필요합니다.</div>;

  const { data: views, error } = await supabase
    .from("user_post_views")
    .select(
      `
      id,
      viewed_at,
      posts (
        id,
        title,
        subtitle,
        post_type,
        model,
        hashtags,
        created_at,
        profiles!posts_user_id_fkey ( display_name, email, avatar_url )
      )
    `
    )
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false }) // ★최신순 정렬
    .limit(20);

  if (error) {
    // [★수정★] error 객체 전체를 서버 콘솔(VSC 터미널)에 출력합니다.
    console.error("HistoryPostForm 쿼리 오류:", error);
    return <div>오류가 발생했습니다. (원인: {error.message})</div>;
  }
  if (!views || views.length === 0) return <div>조회 내역이 없습니다.</div>;

  return (
    <div className="space-y-4">
      {/* [★] Supabase가 타입을 추론하지만, 우리가 만든 타입으로 강제(casting)합니다. */}
      {(views as ViewHistoryType[]).map((view) => (
        <HistoryPost key={view.id} data={view} />
      ))}
    </div>
  );
}
