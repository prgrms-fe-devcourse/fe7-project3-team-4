/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Profile } from "@/types";
import { Calendar, Pencil, SquarePen, X } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type ProfileHeaderProps = {
  profile: Profile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle?: () => void;
  onAvatarClick?: () => void;
  onEditClick?: () => void;
};

type FollowUser = {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
};

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  onAvatarClick,
  onEditClick,
}: ProfileHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"following" | "follower" | null>(
    null
  );
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "가입일 정보 없음";

  // 프로필 링크 클릭 시 모달 닫기
  const handleProfileClick = (userId: string) => {
    handleCloseModal();
    router.push(`/profile?userId=${userId}`);
  };

  // 팔로잉 목록 조회
  const fetchFollowing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        following_id,
        profiles:following_id (
          id,
          display_name,
          email,
          avatar_url
        )
      `
      )
      .eq("follower_id", profile!.id);

    if (error) {
      console.error("Error fetching following:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const followingUsers: FollowUser[] = data
        .filter((item) => item.profiles)
        .map((item: any) => ({
          id: item.profiles.id,
          display_name: item.profiles.display_name || "익명",
          email: item.profiles.email || "",
          avatar_url: item.profiles.avatar_url,
        }));
      setUsers(followingUsers);
    }
    setLoading(false);
  };

  // 팔로워 목록 조회
  const fetchFollowers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        follower_id,
        profiles:follower_id (
          id,
          display_name,
          email,
          avatar_url
        )
      `
      )
      .eq("following_id", profile!.id);

    if (error) {
      console.error("Error fetching followers:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const followerUsers: FollowUser[] = data
        .filter((item) => item.profiles)
        .map((item: any) => ({
          id: item.profiles.id,
          display_name: item.profiles.display_name || "익명",
          email: item.profiles.email || "",
          avatar_url: item.profiles.avatar_url,
        }));
      setUsers(followerUsers);
    }
    setLoading(false);
  };

  // 모달 열기
  const handleOpenModal = (type: "following" | "follower") => {
    setModalType(type);
    setShowModal(true);
    if (type === "following") {
      fetchFollowing();
    } else {
      fetchFollowers();
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
    setUsers([]);
  };

  // Realtime 구독
  useEffect(() => {
    if (!showModal || !modalType) return;

    const channel = supabase
      .channel(`follows:${profile!.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter:
            modalType === "following"
              ? `follower_id=eq.${profile!.id}`
              : `following_id=eq.${profile!.id}`,
        },
        () => {
          if (modalType === "following") {
            fetchFollowing();
          } else {
            fetchFollowers();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showModal, modalType, profile!.id]);

  return (
    <>
      <div className="mt-6 relative pt-10">
        {/* 프로필 이미지 - 본인만 클릭 가능 */}
        <div
          className={`group absolute top-0 left-6 z-10 w-24 h-24 rounded-full bg-gray-300 border-2 flex items-center justify-center border-white ${
            isOwnProfile ? "hover:bg-black/60 cursor-pointer" : "cursor-default"
          }`}
          onClick={isOwnProfile ? onAvatarClick : undefined}
        >
          {profile!.avatar_url ? (
            <Image
              src={profile!.avatar_url}
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
              {profile!.display_name || "닉네임"}
            </p>
            <p className="text-sm text-[#717182] mb-5">
              {profile!.email || "이메일 정보 없음"}
            </p>
            <p className="text-lg mb-6">{profile!.bio || "자기소개"}</p>
            <div className="lg:flex justify-between items-end space-y-2 lg:space-y-0">
              <div className="flex gap-5 text-lg">
                <button
                  onClick={() => handleOpenModal("following")}
                  className="cursor-pointer hover:underline"
                >
                  <span>{profile!.following_count}</span>{" "}
                  <span className="text-[#717182]">팔로잉</span>
                </button>
                <button
                  onClick={() => handleOpenModal("follower")}
                  className="cursor-pointer hover:underline"
                >
                  <span>{profile!.followed_count}</span>{" "}
                  <span className="text-[#717182]">팔로워</span>
                </button>
              </div>
              <div className="flex items-center gap-1 text-[#717182]">
                <Calendar size={16} />
                <span className="text-sm">{joinedDate}에 가입</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 팔로우 목록 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-[#717182]/50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 border-opacity-50">
              <h2 className="text-lg font-semibold">
                {modalType === "following" ? "팔로잉" : "팔로워"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="overflow-y-auto max-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">로딩 중...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">
                    {modalType === "following"
                      ? "팔로잉한 사용자가 없습니다."
                      : "팔로워가 없습니다."}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 divide-opacity-50">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* 프로필 이미지 */}
                        <div
                          onClick={() => handleProfileClick(user.id)}
                          className="w-[50px] h-[50px] bg-gray-400 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
                        >
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={`${user.display_name} avatar`}
                              width={50}
                              height={50}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-neutral-100">
                              profile
                            </span>
                          )}
                        </div>

                        {/* 사용자 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.display_name}
                          </p>
                          <p className="text-sm text-[#717182] truncate">
                            @{user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
