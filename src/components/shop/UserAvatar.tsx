"use client"; // `useEffect`와 `useState`를 사용하므로 "use client" 필수

import { useEffect, useState } from "react";
import Image from "next/image";
import { avatarRingStyles, BadgeVariant } from "@/lib/badgeStyle";
import { getBadgeRarityMap } from "@/lib/badgeCache";

interface UserAvatarProps {
  src: string | null | undefined;
  alt?: string;
  // 3. 'rarity' 대신 'equippedBadgeId'를 prop으로 받습니다.
  equippedBadgeId?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

export default function UserAvatar({
  src,
  alt = "User Avatar",
  equippedBadgeId, // 4. 새 prop 사용
  size = "md",
  className = "",
}: UserAvatarProps) {
  // 5. DB에서 조회한 rarity를 저장할 state
  const [rarity, setRarity] = useState<BadgeVariant | null>(null);

  // 6. `equippedBadgeId`가 바뀔 때마다 캐시 맵에서 조회
  useEffect(() => {
    if (!equippedBadgeId) {
      setRarity(null); // ID 없으면 기본
      return;
    }

    let isMounted = true;

    // 7. DB 조회가 아닌 캐시 맵 조회
    getBadgeRarityMap().then((map) => {
      if (isMounted) {
        // 맵에서 ID로 rarity를 찾아 state에 설정
        setRarity(map.get(equippedBadgeId) || null);
      }
    });

    return () => {
      isMounted = false; // 컴포넌트 언마운트 시 state 설정 방지
    };
  }, [equippedBadgeId]); // ID가 바뀔 때마다 다시 실행

  // 8. state에 저장된 rarity(또는 기본값 'basic')를 사용
  const ringClass = avatarRingStyles[rarity || "basic"];

  return (
    <div
      className={`relative rounded-full transition-all duration-300 ${sizeClasses[size]} ${ringClass} ${className}`}
    >
      <Image
        src={src || "/default-avatar.png"} // 이미지가 없으면 기본 프사
        alt={alt}
        fill // 9. `fill` 속성 추가 (중요!)
        className="h-full w-full rounded-full object-cover"
      />
    </div>
  );
}
