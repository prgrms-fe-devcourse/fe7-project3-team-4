"use client";

import { ProfileHeaderSkeleton } from "./ProfileHeaderSkeleton";
import { ProfileActivityTabsSkeleton } from "./ProfileActivityTabsSkeleton";

export default function ProfilePageSkeleton() {
  return (
    <div className="relative max-w-2xl mx-auto">
      <ProfileHeaderSkeleton />
      <ProfileActivityTabsSkeleton />
    </div>
  );
}
