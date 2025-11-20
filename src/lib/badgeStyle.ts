import { Database } from "@/types";

// DB Enum 타입을 공용으로 사용
export type BadgeVariant = Database["public"]["Enums"]["badge_type"];

// 1. 뱃지 이름 변환
export const rarityLabel: Record<BadgeVariant, string> = {
  basic: "Basic",
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "ultra-rare": "UltraRare",
  epic: "Epic",
  legendary: "Legendary",
};

// 2. 상점 카드용 스타일 (기존)
export const rarityClass: Record<BadgeVariant, string> = {
  basic: "border-gray-200 bg-white text-gray-600 shadow-none",
  common: "border-slate-300 bg-slate-50 text-slate-700 shadow-sm",
  uncommon: "border-emerald-400/80 bg-emerald-50/90 text-emerald-800",
  rare: "border-sky-400/80 bg-sky-50/90 text-sky-800",
  "ultra-rare":
    "border-fuchsia-300/80 bg-fuchsia-50/90 text-fuchsia-700 shadow-md",
  epic: "border-indigo-400/80 bg-indigo-50/90 text-indigo-800 shadow-lg",
  legendary:
    "border-amber-400/80 bg-amber-50/90 text-amber-800 shadow-[0_0_20px_rgba(245,158,11,0.45)]",
};

// 3. 상점 카드 원형 아이콘 그라디언트 (기존)
export const badgeGradient: Record<BadgeVariant, string> = {
  basic:
    "from-gray-100 via-gray-200 to-gray-300 shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-white/50",
  common:
    "from-orange-100 via-stone-300 to-orange-200 shadow-[0_8px_20px_rgba(251,146,60,0.25)]",
  uncommon:
    "from-emerald-300 via-lime-300 to-amber-300 shadow-[0_18px_40px_rgba(34,197,94,0.35)]",
  rare: "from-sky-400 via-cyan-400 to-emerald-400 shadow-[0_18px_40px_rgba(56,189,248,0.45)]",
  "ultra-rare":
    "from-fuchsia-300 via-pink-400 to-purple-500 shadow-[0_18px_40px_rgba(236,72,153,0.45)]",
  epic: "from-indigo-400 via-sky-400 to-purple-500 shadow-[0_18px_40px_rgba(79,70,229,0.55)]",
  legendary:
    "from-amber-300 via-rose-400 to-fuchsia-500 shadow-[0_18px_40px_rgba(236,72,153,0.6)]",
};

// 프로필 사진 크기에 맞게 Tailwind의 'ring' 유틸리티를 사용합니다.
export const avatarRingStyles: Record<BadgeVariant, string> = {
  basic: "bg-slate-200 p-[3px] shadow-sm",
  common:
    "bg-gradient-to-br from-amber-100 to-stone-300 p-[3px] shadow-[0_0_8px_rgba(251,191,36,0.2)]",
  uncommon:
    "bg-gradient-to-br from-lime-400 to-yellow-400 p-[3px] shadow-[0_0_15px_rgba(163,230,53,0.6)]",
  rare: "bg-gradient-to-b from-cyan-400 to-teal-400 p-[3px] shadow-[0_0_15px_rgba(45,212,191,0.6)]",
  "ultra-rare":
    "bg-gradient-to-b from-[#FF99D6] to-[#D946EF] p-[3px] shadow-[0_0_20px_rgba(217,70,239,0.6)]",
  epic: "bg-gradient-to-r from-[#00D4FF] to-[#A020F0] p-[3px] shadow-[0_0_20px_rgba(160,32,240,0.6)]",
  legendary:
    "bg-gradient-to-b from-[#FFCC4D] via-[#FF9554] to-[#FF5294] p-[3px] shadow-[0_0_20px_rgba(255,82,148,0.6)]",
};
