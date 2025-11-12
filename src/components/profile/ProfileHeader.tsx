// src/components/profile/ProfileHeader.tsx
"use client";

import { Profile } from "@/types";
import { Calendar, Pencil, SquarePen } from "lucide-react";
import Image from "next/image";

type ProfileHeaderProps = {
  profile: Profile;
  isOwnProfile: boolean; // ⭐️ 본인 프로필 여부
  isFollowing: boolean; // ⭐️ 팔로우 상태
  onFollowToggle?: () => void; // ⭐️ 팔로우 토글
  onAvatarClick?: () => void;
  onEditClick?: () => void;
};

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  onAvatarClick,
  onEditClick,
}: ProfileHeaderProps) {
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "가입일 정보 없음";

  return (
    <div className="mt-6 relative pt-10">
      {/* 프로필 이미지 - 본인만 클릭 가능 */}
      <div
        className={`group absolute top-0 left-6 z-10 w-24 h-24 rounded-full bg-gray-300 border-2 flex items-center justify-center border-white ${
          isOwnProfile ? "hover:bg-black/60 cursor-pointer" : "cursor-default"
        }`}
        onClick={isOwnProfile ? onAvatarClick : undefined}
      >
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="프로필 이미지"
            fill
            className="object-cover rounded-full" 
          />
        ) : (
          <span className="flex items-center justify-center h-full text-gray-500 group-hover:text-white">
            ...
          </span>
        )}
        {isOwnProfile && (
          <Pencil
            size={20}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>

      {/* 프로필 정보 박스 */}
      <div className="bg-white/40 border border-white/20 rounded-xl shadow-xl">
        <div className="px-6 pb-6 pt-3">
          <div className="w-full flex justify-end mb-8">
            {isOwnProfile ? (
              <button
                type="button"
                onClick={onEditClick}
                className="cursor-pointer leading-none px-4 py-3 flex items-center gap-2 bg-white rounded-xl hover:-translate-y-0.5 hover:shadow-xl"
              >
                <SquarePen size={20} />
                <span>프로필 편집</span>
              </button>
            ) : (
              // ⭐️ 타인 프로필일 때 팔로우 버튼
              <button
                onClick={onFollowToggle}
                className={`cursor-pointer leading-none px-4 py-3 rounded-xl text-white transition-colors ${
                  isFollowing
                    ? "bg-gray-400 hover:bg-gray-500"
                    : "bg-[#6758FF] hover:bg-[#5648E5]"
                }`}
              >
                {isFollowing ? "팔로잉" : "팔로우"}
              </button>
            )}
          </div>
          <p className="text-[22px] mb-3">
            {profile?.display_name || "닉네임"}
          </p>
          <p className="text-sm text-[#717182] mb-5">
            {profile?.email || "이메일 정보 없음"}
          </p>
          <p className="text-lg mb-6">{profile?.bio || "자기소개"}</p>
          <div className="lg:flex justify-between items-end space-y-2 lg:space-y-0">
            <div className="flex gap-5 text-lg">
              <p>
                <span>{profile?.following_count}</span> <span className="text-[#717182]">팔로잉</span>
              </p>
              <p>
                <span>{profile?.followed_count}</span> <span className="text-[#717182]">팔로워</span>
              </p>
            </div>
            <div className="flex items-center gap-1 text-[#717182]">
              <Calendar size={16} />
              <span className="text-sm">{joinedDate}에 가입</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}