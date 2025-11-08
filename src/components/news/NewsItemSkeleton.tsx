"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function NewsItemSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f1f5f9">
      <article className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* 카드 헤더 (사이트 정보) */}
        <div className="p-4 flex items-center gap-3">
          <Skeleton circle={true} height={40} width={40} />
          <div>
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} className="mt-1" />
          </div>
        </div>

        {/* 본문 (제목) */}
        <div className="px-4 pb-2">
          <Skeleton height={24} className="mb-1" />
          <Skeleton height={24} width="80%" />
        </div>

        {/* 썸네일 이미지 */}
        <div className="px-4 pt-0 pb-4">
          <Skeleton className="rounded-lg aspect-video" />
        </div>

        {/* 푸터 (좋아요, 조회수, 북마크) */}
        <div className="p-4 pt-0 flex items-center justify-center gap-35 text-sm text-gray-600">
          <Skeleton height={34} width={80} />
          <Skeleton height={34} width={80} />
          <Skeleton height={34} width={80} />
        </div>
      </article>
    </SkeletonTheme>
  );
}