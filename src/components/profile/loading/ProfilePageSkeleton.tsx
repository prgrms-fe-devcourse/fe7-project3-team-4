"use client";

import { ProfileHeaderSkeleton } from "./ProfileHeaderSkeleton";
import { ProfileActivityTabsSkeleton } from "./ProfileActivityTabsSkeleton";

export default function ProfilePageSkeleton() {
  return (
    <div className="relative">
      <ProfileHeaderSkeleton />
      <ProfileActivityTabsSkeleton />
    </div>
  );
}
