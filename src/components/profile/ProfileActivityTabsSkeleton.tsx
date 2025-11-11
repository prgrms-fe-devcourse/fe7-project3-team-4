// src/components/profile/ProfileActivityTabsSkeleton.tsx
"use client";

import NewsItemSkeleton from "@/components/news/NewsItemSkeleton";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css"; // CSS 임포트

export function ProfileActivityTabsSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f1f5f9">
      {/* Tab Buttons Skeleton */}
      <div className="bg-white/40 border-white/20 rounded-xl shadow-xl">
        <div className="mt-6 p-1 w-full flex ml-24 gap-6 leading-none">
          <div className="flex-1 py-4 rounded-xl">
            <Skeleton width={60} height={20} style={{ margin: "auto" }} />
          </div>
          <div className="flex-1 py-4 rounded-xl">
            <Skeleton width={60} height={20} style={{ margin: "auto" }} />
          </div>
          <div className="flex-1 py-4 rounded-xl">
            <Skeleton width={60} height={20} style={{ margin: "auto" }} />
          </div>
        </div>
      </div>

      <div className="mt-4 lg:mt-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <NewsItemSkeleton key={i} />
        ))}
      </div>
    </SkeletonTheme>
  );
}