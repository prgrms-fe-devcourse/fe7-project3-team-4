// app/store/page.tsx
import BadgeStore from "@/components/badge_store/BadgeStore";
import { createClient } from "@/utils/supabase/server";
import { Tables } from "@/utils/supabase/supabase";

// 뱃지 정보를 포함하여 Client Component에 전달할 최종 Badge 타입
type InitialBadge = Tables<"badges"> & {
  status: "available" | "owned" | "equipped";
};

export default async function StorePage() {
  // 1. 서버 전용 Supabase 클라이언트 생성
  const supabase = await createClient();

  // 2. 현재 로그인된 사용자 정보 및 프로필 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 💡 최적화: 유저 정보가 없으면 포인트 0, equipped_badge_id는 null로 처리
  let equippedBadgeId: string | null = null;
  let initialPoints: number = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("points, equipped_badge_id")
      .eq("id", user.id)
      .single();

    initialPoints = profile?.points ?? 0;
    equippedBadgeId = profile?.equipped_badge_id ?? null;
  }

  // 3. 모든 뱃지 목록 조회 (상점 진열 상품)
  const { data: allBadges, error: badgeError } = await supabase
    .from("badges")
    .select("*");

  if (badgeError) {
    console.error("Badge Fetch Error:", badgeError);
    // 사용자에게 에러를 보여줍니다.
    return (
      <div className="p-10 text-center text-red-600">
        뱃지 목록을 불러오는 데 실패했습니다.
      </div>
    );
  }

  // 4. 유저가 소유한 뱃지 목록 조회
  const { data: userOwnedBadges, error: userBadgeError } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user?.id || "") // 로그인 안 했으면 빈 배열 반환
    .in("badge_id", allBadges?.map((b) => b.id) || []);

  if (userBadgeError) {
    console.error("User Badge Fetch Error:", userBadgeError);
  }

  const ownedBadgeIds = new Set(userOwnedBadges?.map((ub) => ub.badge_id));

  // 5. 💡 핵심: 뱃지 상태 계산 (Status Calculation)
  // Server Component에서 계산하여 Client Component에 완성된 데이터를 넘깁니다.
  const initialBadges: InitialBadge[] =
    allBadges?.map((badge) => {
      let status: "available" | "owned" | "equipped" = "available";

      if (ownedBadgeIds.has(badge.id)) {
        // 소유한 뱃지인 경우
        if (badge.id === equippedBadgeId) {
          status = "equipped";
        } else {
          status = "owned";
        }
      }

      return {
        ...badge,
        status: status,
      };
    }) || [];

  // 6. Client Component에 Props로 전달
  return (
    <BadgeStore initialBadges={initialBadges} initialPoints={initialPoints} />
  );
}
