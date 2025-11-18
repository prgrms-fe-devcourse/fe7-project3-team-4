/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Profile } from "@/types";
import { Calendar, MessageCircle, Pencil, SquarePen, X } from "lucide-react";
import Image from "next/image"; // Image is still used as a fallback/placeholder conceptually, but UserAvatar will be primary
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import UserAvatar from "../shop/UserAvatar";
import Link from "next/link";

type ProfileHeaderProps = {
  profile: Profile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle?: () => void;
  onAvatarClick?: () => void;
  onEditClick?: () => void;
};

// 🌟 2. FollowUser 타입에 equipped_badge_id 추가
type FollowUser = {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  equipped_badge_id: string | null; // 👈 뱃지 ID 추가
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

  // 🌟 3. 팔로잉 목록 조회 쿼리 수정
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
          avatar_url,
          equipped_badge_id
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
          equipped_badge_id: item.profiles.equipped_badge_id, // 👈 뱃지 ID 매핑
        }));
      setUsers(followingUsers);
    }
    setLoading(false);
  };

  // 🌟 4. 팔로워 목록 조회 쿼리 수정
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
          avatar_url,
          equipped_badge_id
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
          equipped_badge_id: item.profiles.equipped_badge_id, // 👈 뱃지 ID 매핑
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
        {/* 🌟 5. 메인 프로필 아바타 수정 */}
        <div
          className={`group absolute top-0 left-6 z-10 w-24 h-24 rounded-full border-2 flex items-center justify-center border-white ${
            // 👈 bg-gray-300 제거
            isOwnProfile ? "cursor-pointer" : "cursor-default"
          }`}
          onClick={isOwnProfile ? onAvatarClick : undefined}
        >
          {/* UserAvatar가 null src도 처리, className으로 크기 전달 */}
          <UserAvatar
            src={profile!.avatar_url}
            alt="프로필 이미지"
            equippedBadgeId={profile?.equipped_badge_id}
            className="w-full h-full" // 👈 부모 div(w-24 h-24)를 꽉 채움
          />

          {isOwnProfile && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
              <Pencil size={32} className="text-white" />
            </div>
          )}
        </div>

        {/* 프로필 정보 박스 */}
        <div className="bg-white/40 border border-white/20 rounded-xl shadow-xl dark:bg-white/20 dark:shadow-white/20">
          <div className="px-6 pb-6 pt-3">
            <div className="w-full flex justify-end mb-8">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={onEditClick}
                  className="cursor-pointer leading-none px-2 py-1 text-xs rounded-md lg:text-base lg:px-4 lg:py-3 flex items-center gap-2 bg-white lg:rounded-xl hover:-translate-y-0.5 hover:shadow-xl dark:bg-white/20"
                >
                  <SquarePen size={20} />
                  <span>프로필 편집</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  {/* 채팅 버튼 */}
                  <Link
                    href={`/message?peerId=${profile!.id}`}
                    className="cursor-pointer leading-none px-2 py-1 text-xs rounded-md lg:text-base lg:px-4 lg:py-3 flex items-center gap-1 lg:rounded-xl border border-[#6758FF]/70 text-[#6758FF] bg-white/70 hover:bg-[#6758FF] hover:text-white dark:bg-white/10 dark:hover:bg-[#6758FF]"
                    title="메시지 보내기"
                  >
                    <MessageCircle size={14} />
                    <span>1:1 채팅</span>
                  </Link>
                  <button
                    onClick={onFollowToggle}
                    className={`cursor-pointer leading-none px-2 py-1 text-xs rounded-md lg:text-base lg:px-4 lg:py-3 lg:rounded-xl text-white transition-colors ${
                      isFollowing
                        ? "bg-gray-400 hover:bg-gray-500"
                        : "bg-[#6758FF] hover:bg-[#5648E5]"
                    }`}
                  >
                    {isFollowing ? "팔로잉" : "+ 팔로우"}
                  </button>
                </div>
              )}
            </div>
            <p className="text-[22px] mb-3">
              {profile!.display_name || "닉네임"}
            </p>
            <p className="text-sm text-[#717182] mb-5 dark:text-[#A6A6DB]">
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
                  <span className="text-[#717182] dark:text-[#A6A6DB]">
                    팔로잉
                  </span>
                </button>
                <button
                  onClick={() => handleOpenModal("follower")}
                  className="cursor-pointer hover:underline"
                >
                  <span>{profile!.followed_count}</span>{" "}
                  <span className="text-[#717182] dark:text-[#A6A6DB]">
                    팔로워
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-1 text-[#717182] dark:text-[#A6A6DB]">
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
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden dark:bg-[#181818]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 border-opacity-50">
              <h2 className="text-lg font-semibold">
                {modalType === "following" ? "팔로잉" : "팔로워"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="overflow-y-auto max-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500 dark:text-white/80">
                    로딩 중...
                  </div>
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
                      className="p-4 hover:bg-gray-50 transition-colors dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        {/* 🌟 6. 모달 내부 아바타 수정 */}
                        <div
                          onClick={() => handleProfileClick(user.id)}
                          className="shrink-0 cursor-pointer"
                        >
                          <UserAvatar
                            src={user.avatar_url}
                            alt={`${user.display_name} avatar`}
                            equippedBadgeId={user.equipped_badge_id}
                            className="w-[50px] h-[50px]" // 👈 className으로 크기 지정
                          />
                        </div>

                        {/* 사용자 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.display_name}
                          </p>
                          <p className="text-sm text-[#717182] truncate dark:text-[#A6A6DB]">
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
