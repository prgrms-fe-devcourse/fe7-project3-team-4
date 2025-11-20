"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function NewsItemSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f1f5f9">
      {/* [수정] NewsItem과 동일한 반투명 컨테이너 스타일 적용 */}
      <article className="bg-white/40 border-white/20 rounded-xl shadow-xl overflow-hidden">
        
        {/* 카드 헤더 (사이트 정보) */}
        {/* [수정] p-4 -> p-6 */}
        <div className="p-6 flex items-center gap-3">
          <Skeleton circle={true} height={40} width={40} />
          <div>
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} className="mt-1" />
          </div>
        </div>

        {/* 본문 (제목) */}
        {/* [수정] px-4 -> px-6 */}
        <div className="px-6 pb-2">
          <Skeleton height={24} className="mb-1" />
          <Skeleton height={24} width="80%" />
        </div>

        {/* 썸네일 이미지 */}
        {/* [수정] px-4 pt-0 pb-4 -> px-6 pt-0 */}
        <div className="px-6 pt-0">
          <Skeleton className="rounded-lg aspect-video" />
        </div>

        {/* [추가] 태그 스켈레톤 */}
        <div className="px-6 pt-3">
          <Skeleton width="60%" height={16} />
        </div>

        {/* 푸터 (좋아요, 조회수, 북마크) */}
        {/* [수정] p-4 pt-0 -> py-6, gap-35 -> gap-30 */}
        <div className="py-6 flex items-center justify-center gap-30 text-sm text-gray-600">
          {/* [수정] 버튼 크기를 Post/NewsItem과 유사하게 조정 */}
          <Skeleton height={30} width={70} />
          <Skeleton height={30} width={70} />
          <Skeleton height={30} width={40} />
        </div>
      </article>
    </SkeletonTheme>
  );
}