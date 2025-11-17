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
  basic: "from-gray-200 via-gray-300 to-gray-400 shadow-none",
  common:
    "from-slate-300 via-slate-400 to-slate-500 shadow-[0_8px_20px_rgba(148,163,184,0.25)]",
  uncommon:
    "from-emerald-300 via-lime-300 to-amber-300 shadow-[0_18px_40px_rgba(34,197,94,0.35)]",
  rare: "from-sky-400 via-cyan-400 to-emerald-400 shadow-[0_18px_40px_rgba(56,189,248,0.45)]",
  "ultra-rare":
    "from-fuchsia-300 via-pink-400 to-purple-500 shadow-[0_18px_40px_rgba(236,72,153,0.45)]",
  epic: "from-indigo-400 via-sky-400 to-purple-500 shadow-[0_18px_40px_rgba(79,70,229,0.55)]",
  legendary:
    "from-amber-300 via-rose-400 to-fuchsia-500 shadow-[0_18px_40px_rgba(236,72,153,0.6)]",
};

// 4. 🌟 [신규] 프로필 아바타용 링(Ring) 스타일
// 프로필 사진 크기에 맞게 Tailwind의 'ring' 유틸리티를 사용합니다.
export const avatarRingStyles: Record<BadgeVariant, string> = {
  basic:
    "ring-1 ring-white/30 backdrop-blur-sm bg-white/10 shadow-[0_0_4px_rgba(255,255,255,0.2)]",
  common:
    "ring-2 ring-white/35 backdrop-blur-sm bg-white/15 shadow-[0_0_6px_rgba(255,255,255,0.25)]",
  uncommon:
    "ring-2 ring-emerald-300/50 backdrop-blur-md bg-emerald-100/15 shadow-[0_0_8px_rgba(16,185,129,0.28)]",
  rare: "ring-2 ring-sky-300/50 backdrop-blur-md bg-sky-100/15 shadow-[0_0_8px_rgba(56,189,248,0.30)]",
  "ultra-rare":
    "ring-3 ring-violet-300/55 backdrop-blur-lg bg-violet-100/15 shadow-[0_0_12px_rgba(139,92,246,0.35)]",
  epic: "ring-4 ring-indigo-300/60 backdrop-blur-lg bg-indigo-100/15 shadow-[0_0_14px_rgba(79,70,229,0.38)]",
  legendary:
    "ring-4 ring-amber-300/65 backdrop-blur-xl bg-amber-100/15 shadow-[0_0_18px_rgba(251,191,36,0.45)]",
};
