// src/app/(home)/profile/page.tsx
import { Suspense } from "react";
import ProfilePageClient from "@/components/profile/ProfilePageClient";
import ProfilePageSkeleton from "@/components/profile/loading/ProfilePageSkeleton";

// ✅ 페이지를 동적으로 렌더링 (항상 최신 데이터 보장)
export const dynamic = "force-dynamic";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; userId?: string }>;
}) {
  return (
    // ✅ ProfilePageClient 전체를 Suspense로 감싸 로딩 처리
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageClient searchParams={searchParams} />
    </Suspense>
  );
}