// hooks/store/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 사용자가 특정 이펙트를 착용하도록 프로필을 업데이트하는 Server Action입니다.
 * @param badgeId - 착용할 이펙트의 UUID (string)
 */
export async function equipBadgeAction(badgeId: string | null) {
  // 1. 서버 전용 Supabase 클라이언트를 생성합니다.
  const supabase = await createClient();

  // 2. 현재 로그인된 사용자 정보를 가져옵니다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 비로그인 사용자 처리
    return { error: "로그인이 필요합니다." };
  }

  // 3. profiles 테이블의 equipped_badge_id를 업데이트합니다.
  const { error } = await supabase
    .from("profiles")
    .update({ equipped_badge_id: badgeId })
    .eq("id", user.id); // RLS 정책에 의해 자신의 ID와 일치하는 행만 수정 가능

  if (error) {
    console.error("이펙트 착용 실패:", error);
    return { error: "이펙트 착용 중 데이터베이스 오류가 발생했습니다." };
  }

  revalidatePath("/store");

  return { success: true };
}

export async function buyBadgeAction(badgeId: string) {
  // 1. 서버 전용 Supabase 클라이언트 생성
  const supabase = await createClient();

  // 2. 현재 로그인된 사용자 정보를 가져옵니다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 3. 💡 핵심: buy_badge RPC 함수 호출
  // 이 RPC 함수는 DB 내부에서 RLS를 무시하고 포인트 차감 및 이펙트 지급을 하나의 트랜잭션으로 처리합니다.
  const { error } = await supabase.rpc("buy_badge", {
    badge_id_to_buy: badgeId,
  });

  if (error) {
    console.error("이펙트 구매 RPC 호출 실패:", error);

    // Supabase RPC에서 RAISE EXCEPTION으로 반환된 에러 메시지를 사용자에게 표시할 수 있습니다.
    // 예: 'Insufficient points or profile not found.'
    return { error: `구매 실패: ${error.message}` };
  }

  // 4. 데이터 갱신 (Revalidation)
  // 구매 성공 후, 이펙트 상점 페이지('/store')의 서버 캐시를 무효화합니다.
  revalidatePath("/store");

  return { success: true };
}
