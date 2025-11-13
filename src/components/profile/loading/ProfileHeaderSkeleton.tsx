"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css"; // CSS 임포트

export function ProfileHeaderSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f1f5f9">
      <div className="mt-6 relative pt-10">
        {/* Avatar Skeleton */}
        <div className="absolute top-0 left-6 z-10 w-24 h-24 rounded-full bg-gray-300 border-2 border-white">
          <Skeleton circle height="100%" width="100%" />
        </div>

        {/* Box Skeleton */}
        <div className="bg-white/40 border-white/20 rounded-xl shadow-xl">
          <div className="px-6 pb-6 pt-3">
            {/* Edit Button Skeleton */}
            <div className="w-full flex justify-end mb-8">
              <Skeleton width={120} height={40} borderRadius="0.75rem" />
            </div>
            {/* Info Skeleton */}
            <p className="text-[22px] mb-3">
              <Skeleton width={150} height={28} />
            </p>
            <p className="text-sm text-[#717182] mb-5">
              <Skeleton width={200} height={16} />
            </p>
            <p className="text-lg mb-6">
              <Skeleton width="80%" height={24} />
            </p>
            <div className="lg:flex justify-between items-end space-y-2 lg:space-y-0">
              <div className="flex gap-5 text-lg">
                <Skeleton width={100} height={24} />
                <Skeleton width={100} height={24} />
              </div>
              <div className="flex items-center gap-1 text-[#717182]">
                <Skeleton width={180} height={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
