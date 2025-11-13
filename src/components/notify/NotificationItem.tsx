import ContentBox from "@/components/ContentBox";
import {
  Heart,
  MessageCircle,
  MessageSquareText,
  UserPlus,
  User,
  X, // ⭐️ 1. 삭제 아이콘(X) import
} from "lucide-react";
import Image from "next/image";
import type {
  NotificationWithDetails,
  NotificationType,
} from "@/types/notification";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import React from "react"; // ⭐️ 2. StopPropagation을 위한 타입 import

// ... formatTimeAgo, TYPE_CONFIG ...
function formatTimeAgo(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // 년
  if (interval > 1) return Math.floor(interval) + "년 전";
  interval = seconds / 2592000; // 개월
  if (interval > 1) return Math.floor(interval) + "개월 전";
  interval = seconds / 86400; // 일
  if (interval > 1) return Math.floor(interval) + "일 전";
  interval = seconds / 3600; // 시간
  if (interval > 1) return Math.floor(interval) + "시간 전";
  interval = seconds / 60; // 분
  if (interval > 1) return Math.floor(interval) + "분 전";
  return Math.floor(seconds) + "초 전";
}

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconColorClass: string;
    message: string;
    showContent: boolean;
  }
> = {
  like: {
    icon: Heart,
    iconColorClass: "text-[#FF569B]",
    message: "님이 회원님의 게시물을 좋아합니다",
    showContent: true,
  },
  comment: {
    icon: MessageSquareText,
    iconColorClass: "text-[#FF6658]",
    message: "님이 회원님의 게시물에 댓글을 남겼습니다",
    showContent: true,
  },
  follow: {
    icon: UserPlus,
    iconColorClass: "text-[#00C950] ml-0.5",
    message: "님이 회원님을 팔로우하기 시작했습니다",
    showContent: false,
  },
  message: {
    icon: MessageCircle,
    iconColorClass: "text-[#6758FF]",
    message: "님이 메시지를 보냈습니다",
    showContent: true,
  },
};

export function NotificationItem({
  data,
  onMarkAsRead,
  onDelete,
}: {
  data: NotificationWithDetails;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  if (!data.type) return null;

  const config = TYPE_CONFIG[data.type];
  const Icon = config.icon;

  const senderName = data.sender?.display_name || "알 수 없는 사용자";
  const senderAvatarUrl = data.sender?.avatar_url;

  const handleClick = async () => {
    if (!data.is_read) {
      onMarkAsRead(data.id);

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", data.id);

      if (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    let href = "/";

    if (data.type === "follow" && data.sender?.id) {
      href = `/profile?userId=${data.sender.id}`;
    } else if (
      (data.type === "like" || data.type === "comment") &&
      data.post_id &&
      data.post_type
    ) {
      href = `/?type=${data.post_type}&id=${data.post_id}`;
    }

    router.push(href);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(data.id);
  };

  return (
    <ContentBox>
      <div
        className={`cursor-pointer rounded-xl transition-colors hover:${
          data.is_read ? "bg-[#DADADA]" : "bg-gray-50"
        } ${data.is_read ? "bg-gray-200" : "bg-white"}`}
        onClick={handleClick}
      >
        <div className="p-6 flex gap-5">
          <div className="relative w-11 h-11 shrink-0">
            <div className="relative w-full h-full bg-gray-200 rounded-full overflow-hidden">
              {senderAvatarUrl ? (
                <Image
                  src={senderAvatarUrl}
                  alt={senderName}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <User size={24} className="text-gray-500" />
                </div>
              )}
            </div>

            <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <Icon size={20} className={config.iconColorClass} />
            </div>
          </div>

          <div className="space-y-2 grow">
            <p className="text-sm">
              <span className="font-medium">{senderName}</span>
              <span className="text-[#717182]">{config.message}</span>
            </p>

            {config.showContent && data.content && (
              <p className="text-sm text-[#111827] line-clamp-1">
                {data.content}
              </p>
            )}

            <p
              className="text-[#717182] text-xs"
              suppressHydrationWarning={true}
            >
              {formatTimeAgo(data.created_at)}
            </p>
          </div>

          <button
            onClick={handleDeleteClick}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 shrink-0 self-start -mr-2 -mt-2" // 정렬 및 디자인
            aria-label="알림 삭제"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </ContentBox>
  );
}
