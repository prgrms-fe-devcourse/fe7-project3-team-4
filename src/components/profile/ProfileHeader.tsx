"use client";

import { Profile } from "@/types"; // [1] Profile 타입 임포트
import { Calendar, Pencil, SquarePen } from "lucide-react";
import Image from "next/image";

type ProfileHeaderProps = {
  profile: Profile; // [2] profile prop 추가
  onAvatarClick?: () => void;
  onEditClick?: () => void;
};

export function ProfileHeader({
  profile, // [3] profile props 받기
  onAvatarClick,
  onEditClick,
}: ProfileHeaderProps) {
  // [4] 날짜 포매팅
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "가입일 정보 없음";

  return (
    <div className="mt-6 relative pt-10">
      {/* 프로필 이미지 (클릭 시 수정 모달 오픈) */}
      <div
        className="group absolute top-0 left-6 z-10 w-24 h-24 rounded-full bg-gray-300 border-2 flex items-center justify-center border-white hover:bg-black/60 cursor-pointer"
        onClick={onAvatarClick}
      >
      {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="프로필 이미지"
            fill
            className="object-cover rounded-full" 
          />
        ) : (
          <span className="text-gray-500 group-hover:text-white">...</span>
        )}
        <Pencil
          size={20}
          className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      {/* 프로필 정보 박스 */}
      <div className="bg-white/40 border-white/20 rounded-xl shadow-xl">
        <div className="px-6 pb-6 pt-3">
          <div className="w-full flex justify-end mb-8">
            <button
              type="button"
              onClick={onEditClick}
              className="cursor-pointer leading-none px-4 py-3 flex items-center gap-2 bg-white rounded-xl hover:-translate-y-0.5 hover:shadow-xl"
            >
              <SquarePen size={20} />
              <span>프로필 편집</span>
            </button>
          </div>
          {/* [5] Static 텍스트를 props 데이터로 교체 */}
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
                <span>1234</span> <span className="text-[#717182]">팔로잉</span>
              </p>
              <p>
                <span>5678</span> <span className="text-[#717182]">팔로워</span>
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