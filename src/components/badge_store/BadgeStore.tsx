"use client";
import { Sparkles, Crown, Check, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import { buyBadgeAction, equipBadgeAction } from "@/hooks/store/actions";
import { Tables } from "@/utils/supabase/supabase";
import Image from "next/image";

type InitialBadge = Tables<"badges"> & {
  status: "available" | "owned" | "equipped";
};

export default function BadgeStore({
  initialBadges,
  initialPoints,
}: {
  initialBadges: InitialBadge[];
  initialPoints: number;
}) {
  const router = useRouter();

  const points = initialPoints;
  const badges = initialBadges;

  const handlePurchase = async (id: string, price: number) => {
    if (points < price) {
      alert("포인트가 부족합니다!");
      return;
    }
    const result = await buyBadgeAction(id);

    if (result.error) {
      alert(result.error);
      return;
    }
    alert("뱃지 구매 및 지급 완료!🥳");
    router.refresh();
  };

  const handleEquip = async (id: string) => {
    const result = await equipBadgeAction(id); // Server Action 호출

    if (result.error) {
      alert(result.error);
      return;
    }

    alert("뱃지 착용 완료!");

    router.refresh();
  };

  const handleUnequip = async () => {
    const result = await equipBadgeAction(null); // null을 전달하여 equipped_badge_id를 NULL로 업데이트

    if (result.error) {
      alert(result.error);
      return;
    }

    alert("뱃지 해제 완료!");
    router.refresh();
  };

  const getStatusStyle = (badge: InitialBadge) => {
    switch (badge.status) {
      case "equipped":
        return "border-2 border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg";
      case "owned":
        return "border-2 border-emerald-200 bg-white shadow-md";
      default:
        return "border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow";
    }
  };

  const getButtonConfig = (badge: InitialBadge) => {
    switch (badge.status) {
      case "equipped":
        return {
          label: "해제하기",
          onClick: () => handleUnequip(),
          className:
            "bg-linear-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600",
        };
      case "owned":
        return {
          label: "착용하기",
          onClick: () => handleEquip(badge.id),
          className:
            "bg-linear-to-r from-emerald-400 to-teal-400 text-white hover:from-emerald-500 hover:to-teal-500",
        };
      default:
        return {
          label: "구매하기",
          onClick: () => handlePurchase(badge.id, badge.price),
          className:
            "bg-linear-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600",
        };
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">algo 뱃지 상점</h1>
                <p className="text-gray-600 text-sm">
                  나만의 특별한 뱃지를 획득하세요
                </p>
              </div>
            </div>

            {/* 포인트 표시 */}
            <div className="bg-linear-to-r from-amber-400 to-orange-400 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2">
              <Coins className="w-5 h-5" />
              <div>
                <div className="text-xs opacity-90">내 포인트</div>
                <div className="text-xl">{points.toLocaleString()}P</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 뱃지 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge: InitialBadge) => {
            const buttonConfig = getButtonConfig(badge);

            return (
              <div
                key={badge.id}
                className={`relative rounded-3xl p-6 transition-all ${getStatusStyle(
                  badge
                )}`}
              >
                {/* 착용 중 표시 */}
                {badge.status === "equipped" && (
                  <div className="absolute -top-3 -right-3 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-full p-2 shadow-lg">
                    <Crown className="w-5 h-5" />
                  </div>
                )}

                {/* 보유 중 표시 */}
                {badge.status === "owned" && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">보유 중</span>
                  </div>
                )}

                {/* 뱃지 아이콘 */}
                <div
                  className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-linear-to-br flex items-center justify-center shadow-md`}
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-linear-to-br flex items-center justify-center shadow-md">
                    <Image
                      src={badge.image_url ?? "/assets/svg/logo.svg"}
                      alt={badge.name}
                      width={60}
                      height={60}
                    />
                  </div>
                </div>

                {/* 뱃지 정보 */}
                <div className="text-center mb-4">
                  <h3 className="mb-2">{badge.name}</h3>
                  {badge.status === "available" && (
                    <p className="text-gray-600 text-sm mb-3">
                      {badge.description}
                    </p>
                  )}
                </div>

                {/* 가격 또는 상태 */}
                {badge.status === "available" && (
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600">
                      {badge.price.toLocaleString()}P
                    </span>
                  </div>
                )}

                {/* 액션 버튼 */}
                <button
                  onClick={buttonConfig.onClick}
                  className={`w-full py-3 rounded-xl transition-all ${buttonConfig.className}`}
                >
                  {buttonConfig.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* 하단 안내 */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-200">
            <p className="text-gray-600">
              💡{" "}
              <span className="text-gray-700">
                뱃지를 구매하고 착용하여 나를 표현해보세요!
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
