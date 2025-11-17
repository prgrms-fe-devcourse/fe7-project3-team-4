"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types";
import { User } from "@supabase/supabase-js";
import { Coins } from "lucide-react";
import { BadgeRow } from "@/app/(home)/shop/page";

// DB의 rarity Enum과 UI 스타일링을 매핑하기 위한 타입 가드
type BadgeVariant = Database["public"]["Enums"]["badge_type"];

// Props 타입 정의
interface BadgeShopProps {
  initialBadges: BadgeRow[];
}

// UI 스타일 매핑 객체들
const rarityLabel: Record<BadgeVariant, string> = {
  legendary: "Legendary",
  epic: "Epic",
  rare: "Rare",
  uncommon: "Uncommon",
  common: "Common",
};

const rarityClass: Record<BadgeVariant, string> = {
  legendary:
    "border-amber-400/80 bg-amber-50/90 text-amber-800 shadow-[0_0_20px_rgba(245,158,11,0.45)]",
  epic: "border-indigo-400/80 bg-indigo-50/90 text-indigo-800",
  rare: "border-sky-400/80 bg-sky-50/90 text-sky-800",
  uncommon: "border-emerald-400/80 bg-emerald-50/90 text-emerald-800",
  common: "border-slate-300/80 bg-slate-50/90 text-slate-700",
};

const badgeGradient: Record<BadgeVariant, string> = {
  legendary:
    "from-amber-300 via-rose-400 to-fuchsia-500 shadow-[0_18px_40px_rgba(236,72,153,0.6)]",
  epic: "from-indigo-400 via-sky-400 to-purple-500 shadow-[0_18px_40px_rgba(79,70,229,0.55)]",
  rare: "from-sky-400 via-cyan-400 to-emerald-400 shadow-[0_18px_40px_rgba(56,189,248,0.5)]",
  uncommon:
    "from-emerald-400 via-lime-400 to-amber-300 shadow-[0_18px_40px_rgba(34,197,94,0.45)]",
  common:
    "from-slate-400 via-slate-500 to-slate-600 shadow-[0_18px_40px_rgba(148,163,184,0.5)]",
};

export default function BadgeShop({ initialBadges }: BadgeShopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [infoFading, setInfoFading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // 로딩 상태 통합 (구매/장착/해제)
  const animatingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  // 유저 상태 관리
  const [user, setUser] = useState<User | null>(null);
  const [myPoints, setMyPoints] = useState<number>(0);
  const [ownedBadgeIds, setOwnedBadgeIds] = useState<Set<string>>(new Set()); // 빠른 조회를 위해 Set 사용
  const [equippedBadgeId, setEquippedBadgeId] = useState<string | null>(null);

  const supabase = createClient();
  const total = initialBadges.length;

  // 1. 초기 데이터 로드 (유저 정보, 포인트, 보유 뱃지, 장착 뱃지)
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // 1-1. 프로필 정보 (포인트, 장착 뱃지) 가져오기
      const { data: profile } = await supabase
        .from("profiles")
        .select("points, equipped_badge_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setMyPoints(profile.points);
        setEquippedBadgeId(profile.equipped_badge_id);
      }

      // 1-2. 보유한 뱃지 목록 가져오기
      const { data: userBadges } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);

      if (userBadges) {
        const ids = new Set(userBadges.map((ub) => ub.badge_id));
        setOwnedBadgeIds(ids);
      }
    };

    fetchUserData();
  }, [supabase]);

  const updateCarousel = useCallback(
    (nextIndex: number) => {
      if (animatingRef.current) return;
      animatingRef.current = true;

      setInfoFading(true);

      setCurrentIndex(() => {
        const normalized = (nextIndex + total) % total;
        return normalized;
      });

      setTimeout(() => {
        setInfoFading(false);
      }, 160);

      setTimeout(() => {
        animatingRef.current = false;
      }, 700);
    },
    [total]
  );

  if (total === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        판매 중인 뱃지가 없습니다.
      </div>
    );
  }

  const currentBadge = initialBadges[currentIndex];
  // 현재 보고 있는 뱃지의 상태 확인
  const isOwned = ownedBadgeIds.has(currentBadge.id);
  const isEquipped = equippedBadgeId === currentBadge.id;

  // --- 핸들러 로직 ---

  // 1. 구매 핸들러
  const handleBuy = async (badge: BadgeRow) => {
    if (isProcessing || !user) return;

    const confirmBuy = confirm(
      `${badge.price}포인트를 사용하여 '${badge.name}' 뱃지를 구매하시겠습니까?`
    );
    if (!confirmBuy) return;

    setIsProcessing(true);

    try {
      const { error } = await supabase.rpc("buy_badge", {
        badge_id_to_buy: badge.id,
      });

      if (error) {
        console.error(error);
        alert(`구매 실패: ${error.message}`);
      } else {
        alert(`구매 성공! '${badge.name}' 뱃지를 획득했습니다.`);
        // UI 즉시 갱신
        setMyPoints((prev) => prev - badge.price);
        setOwnedBadgeIds((prev) => new Set(prev).add(badge.id));
      }
    } catch (err) {
      alert(`알 수 없는 오류가 발생했습니다. (원인: ${err})`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. 장착 핸들러 (DB 업데이트 로직)
  const handleEquip = async (badgeId: string) => {
    if (isProcessing || !user) return;
    setIsProcessing(true);

    try {
      // DB: profiles 테이블의 equipped_badge_id 컬럼을 해당 뱃지 ID로 업데이트
      const { error } = await supabase
        .from("profiles")
        .update({ equipped_badge_id: badgeId })
        .eq("id", user.id);

      if (error) throw error;

      // 성공 시 UI 상태 업데이트
      setEquippedBadgeId(badgeId);
      alert("뱃지를 장착했습니다!");
    } catch (error) {
      console.error("장착 에러:", error);
      alert("뱃지 장착에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. 해제 핸들러 (DB 업데이트 로직)
  const handleUnequip = async () => {
    if (isProcessing || !user) return;
    setIsProcessing(true);

    try {
      // DB: profiles 테이블의 equipped_badge_id 컬럼을 null로 설정하여 해제
      const { error } = await supabase
        .from("profiles")
        .update({ equipped_badge_id: null })
        .eq("id", user.id);

      if (error) throw error;

      // 성공 시 UI 상태 업데이트
      setEquippedBadgeId(null);
      alert("뱃지를 해제했습니다.");
    } catch (error) {
      console.error("해제 에러:", error);
      alert("뱃지 해제에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 기존 캐러셀 UI 핸들러들
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      updateCarousel(currentIndex - 1);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      updateCarousel(currentIndex + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = e.changedTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current == null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = touchStartYRef.current - endY;
    const threshold = 40;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) updateCarousel(currentIndex + 1);
      else updateCarousel(currentIndex - 1);
    }
    touchStartYRef.current = null;
  };

  const getCardPositionClass = (index: number) => {
    const offset = (index - currentIndex + total) % total;
    if (offset === 0) return "z-40 translate-y-0 scale-[1.02]";
    if (offset === 1) return "z-30 translate-y-[96px] scale-[0.92] opacity-95";
    if (offset === 2) return "z-20 translate-y-[184px] scale-[0.82] opacity-60";
    if (offset === total - 1)
      return "z-30 -translate-y-[96px] scale-[0.92] opacity-95";
    if (offset === total - 2)
      return "z-20 -translate-y-[184px] scale-[0.82] opacity-60";
    return "z-10 opacity-0 pointer-events-none scale-75";
  };

  const cardBase =
    "absolute inset-0 m-auto w-full h-[260px] rounded-3xl overflow-hidden cursor-pointer " +
    "bg-slate-900/90 shadow-[0_24px_48px_rgba(15,23,42,0.6),0_0_0_1px_rgba(15,23,42,0.7)] " +
    "transform-gpu transition-transform transition-opacity duration-700 " +
    "ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";

  return (
    <div className="relative w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="font-semibold text-xl">algo 뱃지 상점</h1>
            <p className="text-gray-600 text-sm">
              나만의 특별한 뱃지를 획득하세요
            </p>
          </div>

          {/* 포인트 표시 */}
          <div className="bg-linear-to-r from-[#8F84FF] to-[#6758FF] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-4">
            <Coins className="w-5 h-5" />
            <div>
              <div className="text-xs opacity-90">내 포인트</div>
              <div className="text-xl">{myPoints.toLocaleString()}P</div>
            </div>
          </div>
        </div>
      </div>
      {/* 페이지 루트 */}
      <div
        className="relative z-10 flex min-h-[80vh] w-full items-center justify-center px-4 py-6s outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <main className="flex w-full max-w-5xl flex-col gap-7 rounded-4xl border border-white/20 bg-white/40 p-6 shadow-xl lg:flex-row lg:gap-10 lg:p-8 dark:bg-white/20 dark:shadow-white/10">
          {/* 왼쪽: 뱃지 카드 캐러셀 */}
          {/* ====== 모바일 전용: 좌우 슬라이더 ====== */}
          <section className="flex flex-1 flex-col items-center justify-center gap-4 lg:hidden">
            <div className="relative w-full max-w-[420px] overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {initialBadges.map((badge) => {
                  const rarity = badge.rarity ?? "common";
                  const cardIsOwned = ownedBadgeIds.has(badge.id);
                  const cardIsEquipped = equippedBadgeId === badge.id;

                  return (
                    <div
                      key={badge.id}
                      className="shrink-0 w-full h-[260px] rounded-3xl overflow-hidden cursor-pointer bg-slate-900/90 flex items-center justify-center"
                      onClick={() =>
                        updateCarousel(
                          initialBadges.findIndex((b) => b.id === badge.id)
                        )
                      }
                    >
                      <div className="relative h-full w-full flex flex-col items-center justify-center gap-4">
                        {/* 장착 / 보유 뱃지 상태 라벨 */}
                        {cardIsEquipped && (
                          <div className="absolute left-0 top-6 z-10 w-full -rotate-3 bg-blue-500/90 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-sm">
                            Equipped
                          </div>
                        )}

                        {!cardIsEquipped && cardIsOwned && (
                          <div className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
                            Owned
                          </div>
                        )}

                        {/* 원형 뱃지 아이콘 */}
                        <div
                          className={`relative flex h-40 w-40 items-center justify-center rounded-full bg-linear-to-br ${badgeGradient[rarity]}`}
                        >
                          <div className="absolute inset-2 rounded-full bg-slate-950/80 backdrop-blur-xl" />
                          <div className="relative flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200/90">
                              {rarityLabel[rarity]}
                            </span>
                            <span className="mt-1 text-base font-bold text-white">
                              {badge.name}
                            </span>
                          </div>
                        </div>

                        {/* 카드 하단 라벨 */}
                        <div className="px-4 text-center text-xs text-slate-200/80">
                          {badge.tagline}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 모바일 네비게이션 버튼 (좌우) */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/70 bg-white/90 shadow-sm backdrop-blur-xl hover:bg-blue-50 hover:text-blue-600 dark:bg-white/30 dark:border-slate-300/50 dark:hover:bg-blue-50/70"
                onClick={() => updateCarousel(currentIndex - 1)}
              >
                ←
              </button>
              <button
                type="button"
                className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/70 bg-white/90 shadow-sm backdrop-blur-xl hover:bg-blue-50 hover:text-blue-600 dark:bg-white/30 dark:border-slate-300/50 dark:hover:bg-blue-50/70"
                onClick={() => updateCarousel(currentIndex + 1)}
              >
                →
              </button>
            </div>
          </section>

          {/* ====== 데스크탑 전용: 기존 위/아래 스택 캐러셀 ====== */}
          <section className="hidden lg:flex flex-1 flex-col items-center justify-center gap-5">
            <div className="relative h-[360px] w-full max-w-[420px] transform-gpu">
              {initialBadges.map((badge, index) => {
                const rarity = badge.rarity ?? "common";
                const cardIsOwned = ownedBadgeIds.has(badge.id);
                const cardIsEquipped = equippedBadgeId === badge.id;

                return (
                  <div
                    key={badge.id}
                    className={`${cardBase} ${getCardPositionClass(index)}`}
                    onClick={() => updateCarousel(index)}
                  >
                    {cardIsEquipped && (
                      <div className="absolute left-0 top-6 z-10 w-full -rotate-3 bg-blue-500/90 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-sm">
                        Equipped
                      </div>
                    )}

                    {!cardIsEquipped && cardIsOwned && (
                      <div className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
                        Owned
                      </div>
                    )}

                    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                      <div
                        className={`relative flex h-40 w-40 items-center justify-center rounded-full bg-linear-to-br ${badgeGradient[rarity]}`}
                      >
                        <div className="absolute inset-2 rounded-full bg-slate-950/80 backdrop-blur-xl" />
                        <div className="relative flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200/90">
                            {rarityLabel[rarity]}
                          </span>
                          <span className="mt-1 text-base font-bold text-white">
                            {badge.name}
                          </span>
                        </div>
                      </div>

                      <div className="px-4 text-center text-xs text-slate-200/80">
                        {badge.tagline}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 데스크탑 네비게이션 버튼 (위/아래) */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/70 bg-white/90 shadow-sm backdrop-blur-xl hover:bg-blue-50 hover:text-blue-600 dark:bg-white/30 dark:border-slate-300/50 dark:hover:bg-blue-50/70"
                onClick={() => updateCarousel(currentIndex - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/70 bg-white/90 shadow-sm backdrop-blur-xl hover:bg-blue-50 hover:text-blue-600 dark:bg-white/30 dark:border-slate-300/50 dark:hover:bg-blue-50/70"
                onClick={() => updateCarousel(currentIndex + 1)}
              >
                ↓
              </button>
            </div>
          </section>

          {/* 오른쪽: 뱃지 상세 / 가격 / 버튼 영역 */}
          <section className="flex flex-1 flex-col justify-center gap-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-[#A6A6DB]">
              Badge shop
            </p>

            <div
              className={`space-y-4 transition-opacity duration-300 ${
                infoFading ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="inline-block text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#0b1f4a] lg:text-[2.1rem]">
                    <span className="relative inline-block pb-1 dark:text-[#80a8ff]">
                      {currentBadge.name}
                      <span className="absolute bottom-0 left-0 h-[3px] w-[72px] rounded-full bg-linear-to-r from-blue-500 via-indigo-500 to-pink-500" />
                    </span>
                  </h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                    {rarityLabel[currentBadge.rarity ?? "common"]} badge
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] ${
                    rarityClass[currentBadge.rarity ?? "common"]
                  }`}
                >
                  {rarityLabel[currentBadge.rarity ?? "common"]}
                </span>
              </div>

              <p className=" font-medium">{currentBadge.tagline}</p>
              <p className="max-w-md leading-relaxed text-slate-600 dark:text-[#A6A6DB]">
                {currentBadge.description}
              </p>

              {currentBadge.perks && currentBadge.perks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                    Perks
                  </p>
                  <ul className="space-y-1.5 text-slate-600 dark:text-[#A6A6DB]">
                    {currentBadge.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#6758FF]" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 🌟 [New] 버튼 영역: 상태에 따른 분기 처리 */}
            <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-lg backdrop-blur-xl dark:bg-white/10 dark:border-white/40">
              <div className="flex items-end justify-between gap-3">
                <div>
                  {isOwned ? (
                    // 보유 중일 때 메시지
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#A6A6DB]">
                        Status
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-lg font-bold text-indigo-600">
                          보유 중인 뱃지
                        </span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                          Owned
                        </span>
                      </div>
                    </div>
                  ) : (
                    // 미보유 시 가격 표시
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#A6A6DB]">
                        Price
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold">
                          {currentBadge.price.toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-slate-500 dark:text-[#A6A6DB]">
                          points
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 버튼 로직 분기 */}
                {!isOwned ? (
                  // Case 1: 미보유 -> 구매하기 버튼
                  <button
                    type="button"
                    disabled={isProcessing}
                    className={`cursor-pointer inline-flex items-center justify-center rounded-xl bg-linear-to-r from-indigo-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(79,70,229,0.45)]
                      ${
                        isProcessing
                          ? "cursor-wait opacity-70"
                          : "hover:-translate-y-px hover:shadow-[0_8px_16px_rgba(79,70,229,0.65)] active:translate-y-0"
                      }`}
                    onClick={() => handleBuy(currentBadge)}
                  >
                    {isProcessing ? "처리 중..." : "구매하기"}
                    {!isProcessing && (
                      <span className="ml-2 text-xs opacity-90">→</span>
                    )}
                  </button>
                ) : isEquipped ? (
                  // Case 2: 보유 중 & 장착 중 -> 해제하기 버튼
                  <button
                    type="button"
                    disabled={isProcessing}
                    className={`inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm
                      ${
                        isProcessing
                          ? "cursor-wait opacity-70"
                          : "hover:bg-slate-50"
                      }`}
                    onClick={handleUnequip}
                  >
                    {isProcessing ? "..." : "해제하기"}
                  </button>
                ) : (
                  // Case 3: 보유 중 & 미장착 -> 장착하기 버튼
                  <button
                    type="button"
                    disabled={isProcessing}
                    className={`inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-lg
                      ${
                        isProcessing
                          ? "cursor-wait opacity-70"
                          : "hover:-translate-y-px hover:bg-slate-900 active:translate-y-0 active:scale-[0.98]"
                      }`}
                    onClick={() => handleEquip(currentBadge.id)}
                  >
                    {isProcessing ? "..." : "장착하기"}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-[#A6A6DB]">
                * 포인트는 활동 보상, 챌린지 참여, 이벤트 등을 통해 적립할 수
                있어요.
              </p>
            </div>

            {/* 인덱스 도트 네비게이션 */}
            <div className="space-y-2">
              <div className="flex gap-2">
                {initialBadges.map((badge, index) => (
                  <button
                    key={badge.id}
                    type="button"
                    className={`cursor-pointer relative h-[9px] w-[9px] rounded-full bg-slate-400/70 ${
                      index === currentIndex
                        ? "scale-[1.6] bg-linear-to-tr from-blue-500 to-indigo-500 shadow-[0_0_0_4px_rgba(129,140,248,0.18)]"
                        : ""
                    }`}
                    onClick={() => updateCarousel(index)}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
