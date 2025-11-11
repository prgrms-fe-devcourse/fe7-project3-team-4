// src/components/profile/ProfilePageSkeleton.tsx
"use client";

import { ProfileHeaderSkeleton } from "./ProfileHeaderSkeleton";
import { ProfileActivityTabsSkeleton } from "./ProfileActivityTabsSkeleton";

/**
 * ProfilePageClient의 전체 로딩 스켈레톤입니다.
 * 헤더와 탭 영역을 포함합니다.
 */
export default function ProfilePageSkeleton() {
  return (
    <div className="relative">
      <ProfileHeaderSkeleton />
      <ProfileActivityTabsSkeleton />
    </div>
  );
}