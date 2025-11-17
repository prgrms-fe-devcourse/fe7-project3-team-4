import { createClient } from "@/utils/supabase/client";
import { BadgeVariant } from "./badgeStyle";

// 1. 캐시된 맵 (모듈 레벨에 저장)
let badgeRarityMap: Map<string, BadgeVariant | null> | null = null;

// 2. 중복 요청 방지를 위한 Promise
let promise: Promise<Map<string, BadgeVariant | null>> | null = null;

/**
 * 모든 뱃지의 ID와 Rarity 맵을 가져옵니다.
 * 최초 호출 시 DB에서 가져오고, 이후에는 캐시된 맵을 반환합니다.
 */
export const getBadgeRarityMap = (): Promise<
  Map<string, BadgeVariant | null>
> => {
  // 3. 캐시가 이미 있으면 즉시 반환
  if (badgeRarityMap) {
    return Promise.resolve(badgeRarityMap);
  }

  // 4. 현재 요청 중인 Promise가 있으면 그것을 반환 (N+1 방지 핵심)
  if (promise) {
    return promise;
  }

  // 5. 최초 요청 시 DB 조회
  promise = new Promise(async (resolve) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("badges").select("id, rarity");

    const map = new Map<string, BadgeVariant | null>();
    if (data) {
      data.forEach((badge) => {
        // 'basic', 'legendary' 등 DB의 Enum 값을 BadgeVariant로 타입 단언
        map.set(badge.id, badge.rarity as BadgeVariant);
      });
    } else {
      console.error("Failed to fetch badge map:", error);
    }

    badgeRarityMap = map; // 맵 캐시
    promise = null; // Promise 초기화
    resolve(badgeRarityMap);
  });

  return promise;
};
