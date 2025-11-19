"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { Coins } from "lucide-react";
import { BadgeRow } from "@/app/(home)/shop/page";

// 👇 1. 스타일 정의를 외부 파일에서 가져옵니다.
import { rarityLabel, rarityClass, badgeGradient } from "@/lib/badgeStyle"; // (경로는 실제 위치에 맞게 수정)
import { useToast } from "../common/toast/ToastContext";
import ConfirmModal from "../common/ConfirmModal";

interface BadgeShopProps {
  initialBadges: BadgeRow[];
}

export default function BadgeShop({ initialBadges }: BadgeShopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [infoFading, setInfoFading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // 로딩 상태 통합 (구매/장착/해제)
  const [activeTab, setActiveTab] = useState<"all" | "owned">("all"); // 👈 탭 상태
  const animatingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  // 유저 상태 관리
  const [user, setUser] = useState<User | null>(null);
  const [myPoints, setMyPoints] = useState<number>(0);
  const [ownedBadgeIds, setOwnedBadgeIds] = useState<Set<string>>(new Set());
  const [equippedBadgeId, setEquippedBadgeId] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeRow | null>(null);

  const supabase = createClient();

  // 1. 초기 데이터 로드
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // 1-1. 프로필 정보
      const { data: profile } = await supabase
        .from("profiles")
        .select("points, equipped_badge_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setMyPoints(profile.points);
        setEquippedBadgeId(profile.equipped_badge_id);
      }

      // 1-2. 보유 이펙트 목록
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

  // 🔹 보유 이펙트 목록 / 표시 대상 이펙트 목록
  const ownedBadges = useMemo(
    () => initialBadges.filter((badge) => ownedBadgeIds.has(badge.id)),
    [initialBadges, ownedBadgeIds]
  );

  const displayedBadges = useMemo(
    () => (activeTab === "owned" ? ownedBadges : initialBadges),
    [activeTab, ownedBadges, initialBadges]
  );

  const total = displayedBadges.length;

  // 탭이 바뀌거나 목록 길이가 바뀌면 인덱스 초기화
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab, total]);

  const updateCarousel = useCallback(
    (nextIndex: number) => {
      if (animatingRef.current || total === 0) return;
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

  const currentBadge: BadgeRow | null =
    total > 0 ? displayedBadges[currentIndex] : null;

  const isOwned = currentBadge ? ownedBadgeIds.has(currentBadge.id) : false;
  const isEquipped = currentBadge && equippedBadgeId === currentBadge.id;

  // --- 핸들러 로직 ---
  const { showToast } = useToast();
  const handleBuy = (badge: BadgeRow) => {
    if (!user) {
      showToast({
        title: "이펙트 구매 실패",
        message: "로그인이 필요합니다.",
        variant: "warning",
      });
      return;
    }

    setSelectedBadge(badge);
    setConfirmOpen(true);
  };
  const handleConfirmBuy = async () => {
    if (!selectedBadge || !user) return;
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const { error } = await supabase.rpc("buy_badge", {
        badge_id_to_buy: selectedBadge.id,
      });

      if (error) {
        showToast({
          title: "이펙트 구매 실패",
          message: "포인트가 부족합니다.",
          variant: "warning",
        });
      } else {
        showToast({
          title: "이펙트 구매 성공!",
          message: `${selectedBadge.name} 이펙트를 획득했습니다.`,
          variant: "success",
        });
        setMyPoints((prev) => prev - selectedBadge.price);
        setOwnedBadgeIds((prev) => new Set(prev).add(selectedBadge.id));
      }
    } catch (err) {
      showToast({
        title: "이펙트 구매 오류",
        message: `이펙트 구매 중 오류가 발생했습니다.`,
        variant: "error",
      });
      console.error(err);
    } finally {
      setIsProcessing(false);
      setConfirmOpen(false);
    }
  };

  const handleEquip = async (badgeId: string) => {
    if (isProcessing || !user) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ equipped_badge_id: badgeId })
        .eq("id", user.id);

      if (error) throw error;

      setEquippedBadgeId(badgeId);
      showToast({
        title: "이펙트 장착 완료!",
        message: "이펙트를 장착했습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("장착 에러:", error);
      showToast({
        title: "이펙트 장착 오류",
        message: "이펙트 장착 중 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnequip = async () => {
    if (isProcessing || !user) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ equipped_badge_id: null })
        .eq("id", user.id);

      if (error) throw error;

      setEquippedBadgeId(null);
      showToast({
        title: "이펙트 해제 완료",
        message: "이펙트를 해제했습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("해제 에러:", error);
      showToast({
        title: "이펙트 해제 오류",
        message: "이펙트 해제 중 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  // 판매 중인 이펙트가 아예 없을 때 (DB 자체가 비어있음)
  if (initialBadges.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        판매 중인 이펙트가 없습니다.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden max-w-4xl mx-auto px-2 lg:px-6 lg:pt-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h1 className="font-semibold text-xl">프로필 이펙트 상점</h1>
          <p className="text-gray-600 text-sm">
            프로필을 나답게 보여줄 이펙트를 골라보세요
          </p>

          {/* 🔹 전체 / 보유 이펙트 탭 */}
          <div className="inline-flex rounded-full bg-slate-100/80 p-1 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`cursor-pointer px-4 py-2 rounded-full transition ${
                activeTab === "all"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              전체 이펙트
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("owned")}
              className={`cursor-pointer px-4 py-2 rounded-full transition ${
                activeTab === "owned"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              보유 이펙트
            </button>
          </div>
        </div>

        {/* 포인트 표시 */}
        <div className="bg-linear-to-r from-[#8F84FF] to-[#6758FF] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-4">
          <Coins className="w-5 h-5" />
          <div>
            <div className="text-xs opacity-90">내 포인트</div>
            <div className="text-xl">{myPoints.toLocaleString()}P</div>
          </div>
        </div>
        {selectedBadge && (
          <ConfirmModal
            title="구매 확인"
            description={`${selectedBadge.price}포인트를 사용하여 ${selectedBadge.name} 이펙트를 구매하시겠습니까?`}
            onConfirm={handleConfirmBuy}
            onCancel={() => setConfirmOpen(false)}
            open={confirmOpen}
          />
        )}
      </div>

      {/* 페이지 루트 */}
      <div
        className="relative z-10 flex items-center justify-center outline-none py-8 lg:pt-12"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <main className="flex min-w-full flex-col gap-7 rounded-4xl border border-white/20 bg-white/40 p-6 shadow-xl lg:flex-row lg:gap-10 lg:p-8 dark:bg-white/20 dark:shadow-white/10">
          {/* 왼쪽: 이펙트 카드 캐러셀 */}
          {/* 모바일 전용 */}
          <section className="flex flex-1 flex-col items-center justify-center gap-4 lg:hidden">
            <div className="relative w-full max-w-[420px] overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {displayedBadges.map((badge, index) => {
                  const rarity = badge.rarity ?? "common";
                  const cardIsOwned = ownedBadgeIds.has(badge.id);
                  const cardIsEquipped = equippedBadgeId === badge.id;

                  return (
                    <div
                      key={badge.id}
                      className="shrink-0 w-full h-[260px] rounded-3xl overflow-hidden cursor-pointer bg-slate-900/90 flex items-center justify-center"
                      onClick={() => updateCarousel(index)}
                    >
                      <div className="relative h-full w-full flex flex-col items-center justify-center gap-4">
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
            </div>

            {displayedBadges.length !== 1 ? (
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
            ) : null}
          </section>

          {/* 데스크탑 전용 */}
          <section className="hidden lg:flex flex-1 flex-col items-center justify-center gap-5">
            {/* 🌟 수정됨: h-[360px] -> h-[640px]로 변경하여 카드 상단이 잘리지 않도록 함 */}
            <div className="relative h-[590px] w-full max-w-[420px] transform-gpu">
              {displayedBadges.map((badge, index) => {
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

            {displayedBadges.length !== 1 ? (
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
            ) : null}
          </section>

          {/* 오른쪽: 상세 영역 */}
          <section className="flex flex-1 flex-col justify-center gap-6">
            {currentBadge ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-[#A6A6DB]">
                  Effect shop
                </p>

                <div
                  className={`space-y-4 transition-opacity duration-300 ${
                    infoFading ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="inline-block text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#0b1f4a] lg:text-[2.1rem]">
                        <span className="relative inline-block pb-1 dark:text-[#6998ff]">
                          {currentBadge.name}
                          <span className="absolute bottom-0 left-0 h-[3px] w-[72px] rounded-full bg-linear-to-r from-blue-500 via-indigo-500 to-pink-500" />
                        </span>
                      </h2>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                        {rarityLabel[currentBadge.rarity ?? "common"]} Effect
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

                  <p className="font-medium">{currentBadge.tagline}</p>
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

                {/* 버튼 / 상태 영역 */}
                <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-lg backdrop-blur-xl dark:bg-white/20 dark:border-white/40">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      {isOwned ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#A6A6DB]">
                            Status
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-lg font-bold text-[#6758FF] dark:text-[#2e258f]">
                              보유 중인 이펙트
                            </span>
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-[#6758FF]">
                              Owned
                            </span>
                          </div>
                        </div>
                      ) : (
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

                    {activeTab === "owned" ? (
                      isOwned && isEquipped ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          className={`cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm
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
                        <button
                          type="button"
                          disabled={isProcessing}
                          className={`cursor-pointer inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-lg
                        ${
                          isProcessing
                            ? "cursor-wait opacity-70"
                            : "hover:-translate-y-px hover:bg-slate-900 active:translate-y-0 active:scale-[0.98]"
                        }`}
                          onClick={() => handleEquip(currentBadge.id)}
                        >
                          {isProcessing ? "..." : "장착하기"}
                        </button>
                      )
                    ) : !isOwned ? (
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
                    ) : (
                      <div
                        className={`inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm`}
                      >
                        구매완료
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-[#A6A6DB]">
                    * 포인트는 활동 보상, 챌린지 참여, 이벤트 등을 통해 적립할
                    수 있어요.
                  </p>
                </div>

                {/* 인덱스 도트 네비게이션 */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {displayedBadges.map((badge, index) => (
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
              </>
            ) : (
              // 🔹 보유 이펙트 탭인데 아무것도 없을 때 등
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-[#A6A6DB]">
                  Effect shop
                </p>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  아직 표시할 이펙트가 없어요
                </h2>
                <p className="text-sm text-slate-600 dark:text-[#A6A6DB]">
                  {activeTab === "owned"
                    ? "보유한 이펙트가 아직 없어요. 상점에서 이펙트를 구매하면 여기에서 한 번에 모아볼 수 있어요."
                    : "판매 중인 이펙트가 없습니다."}
                </p>
                {activeTab === "owned" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-900"
                  >
                    전체 이펙트 보러가기
                  </button>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
