import ContentBox from "@/components/ContentBox";
import {
  Heart,
  MessageCircle,
  MessageSquareText,
  UserPlus,
} from "lucide-react";

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconColor: string;
    message: string;
    showContent: boolean;
  }
> = {
  like: {
    icon: Heart,
    iconColor: "#FF569B",
    message: "님이 회원님의 게시물을 좋아합니다",
    showContent: true, // 게시글 제목 등
  },
  comment: {
    icon: MessageSquareText,
    iconColor: "#FF6658",
    message: "님이 회원님의 게시물에 댓글을 남겼습니다",
    showContent: true, // 댓글 내용
  },
  follow: {
    icon: UserPlus,
    iconColor: "#00C950",
    message: "님이 회원님을 팔로우하기 시작했습니다",
    showContent: false,
  },
  message: {
    icon: MessageCircle,
    iconColor: "#6758FF",
    message: "님이 메시지를 보냈습니다",
    showContent: true, // DM 내용 프리뷰
  },
};

export function NotificationItem({ data }: { data: Notify }) {
  const config = TYPE_CONFIG[data.type];
  const Icon = config.icon;

  return (
    <ContentBox>
      <div className="p-6 flex gap-5">
        {/* 프로필 이미지 */}
        <div className="relative w-11 h-11 bg-gray-300 rounded-full">
          {/* 타입별 아이콘 */}
          <div className="absolute -right-1.5 -bottom-1.5 w-7 h-7 bg-white rounded-full flex items-center justify-center">
            <Icon size={20} className={`text-[${config.iconColor}]`} />
          </div>
        </div>

        <div className="space-y-2">
          {/* 알림 문구 */}
          <p className="text-sm">
            <span className="font-medium">{data.sender}</span>{" "}
            <span className="text-[#717182]">{config.message}</span>
          </p>

          {/* 내용 (옵션) */}
          {config.showContent && data.content && (
            <p className="text-sm text-[#111827] line-clamp-1">
              {data.content}
            </p>
          )}

          {/* 시간 */}
          <p className="text-[#717182] text-xs">{data.createdAtText}</p>
        </div>
      </div>
    </ContentBox>
  );
}
