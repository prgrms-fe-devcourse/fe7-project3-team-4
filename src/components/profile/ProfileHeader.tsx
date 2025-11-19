"use client";

import { Profile } from "@/types";
import {
  Calendar,
  MessageCircle,
  Pencil,
  SquarePen,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import UserAvatar from "../shop/UserAvatar";

type ProfileHeaderProps = {
  profile: Profile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle?: () => void;
  onAvatarClick?: () => void;
  onEditClick?: () => void;
};

// FollowUser 타입은 그대로 유지
type FollowUser = {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  equipped_badge_id: string | null;
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
  const [isMessageLoading, setIsMessageLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "가입일 정보 없음";

  // 채팅방 이동 핸들러
  const handleMessageClick = async () => {
    if (!profile?.id || isMessageLoading) return;

    try {
      setIsMessageLoading(true);
      const { data: roomId, error } = await supabase.rpc("ensure_direct_room", {
        other_user_id: profile.id,
      });

      if (error) {
        console.error("Error fetching room ID:", error);
        alert("채팅방을 불러오는데 실패했습니다.");
        return;
      }

      if (roomId) {
        router.push(`/message?peerId=${profile.id}&roomId=${roomId}`);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsMessageLoading(false);
    }
  };

  const handleProfileClick = (userId: string) => {
    handleCloseModal();
    router.push(`/profile?userId=${userId}`);
  };

  // 🌟 any 제거 및 타입 안전성 확보
  const fetchFollowing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        following_id,
        profiles:profiles!following_id (
          id,
          display_name,
          email,
          avatar_url,
          equipped_badge_id
        )
      `
      )
      // 👆 설명: "profiles 테이블이랑 조인할 건데(!), following_id 컬럼을 써줘. 그리고 결과 이름은 profiles(:)로 해줘."
      .eq("follower_id", profile!.id);

    if (error) {
      console.error("Error fetching following:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const followingUsers: FollowUser[] = data
        .filter((item) => item.profiles)
        .map((item) => {
          // 이제 item.profiles에서 에러가 나지 않고 자동완성이 뜰 겁니다.
          const targetProfile = item.profiles!;

          return {
            id: targetProfile.id,
            display_name: targetProfile.display_name || "익명",
            email: targetProfile.email || "",
            avatar_url: targetProfile.avatar_url,
            equipped_badge_id: targetProfile.equipped_badge_id,
          };
        });
      setUsers(followingUsers);
    }
    setLoading(false);
  };

  // 🌟 any 제거 및 타입 안전성 확보
  const fetchFollowers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        follower_id,
        profiles:profiles!follower_id (
          id,
          display_name,
          email,
          avatar_url,
          equipped_badge_id
        )
      `
      )
      // 👆 설명: "profiles 테이블이랑 조인할 건데(!), follower_id 컬럼을 써줘."
      .eq("following_id", profile!.id);

    if (error) {
      console.error("Error fetching followers:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const followerUsers: FollowUser[] = data
        .filter((item) => item.profiles)
        .map((item) => {
          const targetProfile = item.profiles!;

          return {
            id: targetProfile.id,
            display_name: targetProfile.display_name || "익명",
            email: targetProfile.email || "",
            avatar_url: targetProfile.avatar_url,
            equipped_badge_id: targetProfile.equipped_badge_id,
          };
        });
      setUsers(followerUsers);
    }
    setLoading(false);
  };

  const handleOpenModal = (type: "following" | "follower") => {
    setModalType(type);
    setShowModal(true);
    if (type === "following") {
      fetchFollowing();
    } else {
      fetchFollowers();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
    setUsers([]);
  };

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
        <div
          className={`group absolute top-0 left-6 z-10 w-24 h-24 rounded-full border-2 flex items-center justify-center border-white ${
            isOwnProfile ? "cursor-pointer" : "cursor-default"
          }`}
          onClick={isOwnProfile ? onAvatarClick : undefined}
        >
          <UserAvatar
            src={profile!.avatar_url}
            alt="프로필 이미지"
            equippedBadgeId={profile?.equipped_badge_id}
            className="w-full h-full"
          />

          {isOwnProfile && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
              <Pencil size={32} className="text-white" />
            </div>
          )}
        </div>

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
                  <button
                    onClick={handleMessageClick}
                    disabled={isMessageLoading}
                    className="cursor-pointer leading-none px-2 py-1 text-xs rounded-md lg:text-base lg:px-4 lg:py-3 flex items-center gap-1 lg:rounded-xl border border-[#6758FF]/70 text-[#6758FF] bg-white/70 hover:bg-[#6758FF] hover:text-white dark:bg-[#6758FF] dark:hover:bg-white/10 dark:hover:text-[#6758FF] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="메시지 보내기"
                  >
                    {isMessageLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <MessageCircle size={14} />
                    )}
                    <span>1:1 채팅</span>
                  </button>

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

      {showModal && (
        <div
          className="fixed inset-0 bg-[#717182]/50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden dark:bg-[#181818]"
            onClick={(e) => e.stopPropagation()}
          >
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
                        <div
                          onClick={() => handleProfileClick(user.id)}
                          className="shrink-0 cursor-pointer"
                        >
                          <UserAvatar
                            src={user.avatar_url}
                            alt={`${user.display_name} avatar`}
                            equippedBadgeId={user.equipped_badge_id}
                            className="w-[50px] h-[50px]"
                          />
                        </div>

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
