import BadgeStore from "@/components/badge_store/BadgeStore";
import { Database } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

// Supabase Row 타입 추론을 활용해 타입을 안전하게 가져옵니다.
export type BadgeRow = Database["public"]["Tables"]["badges"]["Row"];

export default async function Page() {
  // 1. 서버 사이드 클라이언트 생성
  const supabase = await createClient();

  // 2. DB에서 뱃지 데이터 조회 (가격 낮은 순 정렬 예시)
  const { data: badges, error } = await supabase
    .from("badges")
    .select("*")
    .order("price", { ascending: true });

  if (error) {
    console.error("Error fetching badges:", error);
    // 실무에서는 에러 페이지나 토스트 메시지로 처리하지만, 여기선 빈 배열을 넘기거나 에러 UI를 보여줍니다.
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        상점 데이터를 불러오는데 실패했습니다.
      </div>
    );
  }

  // 3. 클라이언트 컴포넌트에 데이터 주입 (Props Down)
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-slate-500">
          상점 불러오는 중...
        </div>
      }
    >
      {" "}
      <BadgeStore initialBadges={badges ?? []} />
    </Suspense>
  );
}
