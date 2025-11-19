"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { avatarRingStyles, BadgeVariant } from "@/lib/badgeStyle";
import { getBadgeRarityMap } from "@/lib/badgeCache";

interface UserAvatarProps {
  src: string | null | undefined;
  alt?: string;
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
  equippedBadgeId,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [rarity, setRarity] = useState<BadgeVariant | null>(null);

  useEffect(() => {
    if (!equippedBadgeId) {
      setRarity(null);
      return;
    }

    let isMounted = true;

    getBadgeRarityMap().then((map) => {
      if (isMounted) {
        setRarity(map.get(equippedBadgeId) || null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [equippedBadgeId]);

  // rarity가 없으면 기본값 처리
  const ringClass = avatarRingStyles[rarity || "basic"];

  return (
    <div
      className={`relative flex items-center justify-center rounded-full ${className} ${sizeClasses[size]} ${ringClass} p-2`}
    >
      {/* [중요] 내부 래퍼 추가 
        - 바깥 div는 그라디언트와 패딩(테두리 두께)을 담당합니다.
        - 이 내부 div는 실제 이미지 영역을 잡아주며, 패딩 안쪽으로 컨텐츠를 제한합니다.
        - bg-white는 투명 PNG일 경우 배경이 그라디언트로 비치는 것을 방지합니다.
      */}
      <div
        className={`relative h-full w-full overflow-hidden rounded-full bg-white`}
      >
        {src ? (
          <Image
            src={src || "/default-avatar.png"}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center font-bold text-gray-500">
            ?
          </div>
        )}
      </div>
    </div>
  );
}
