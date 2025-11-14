import Link from "next/link";
import Image from "next/image";
import { ViewHistoryType } from "@/types/Post";
import { useMemo } from "react";
import { X } from "lucide-react";

const getBoardTitle = (postType: string | undefined, subType?: string) => {
  let boardName = "";
  switch (postType) {
    case "prompt":
      boardName = "프롬프트 게시판";
      break;
    case "news":
      boardName = "뉴스 게시판";
      break;
    case "weekly":
      boardName = "주간챌린지 게시판";
      break;
    case "free":
      boardName = "자유 게시판";
      break;
    default:
      boardName = "게시판"; // 기본값
  }

  if (subType) {
    return `${boardName} - ${subType.toUpperCase()}`;
  }
  return boardName;
};

const timeAgo = (dateString: string): string => {
  if (!dateString) return "";

  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  let interval = seconds / 31536000; // 1년
  if (interval > 1) return Math.floor(interval) + "년 전";
  interval = seconds / 2592000; // 1달
  if (interval > 1) return Math.floor(interval) + "달 전";
  interval = seconds / 86400; // 1일
  if (interval > 1) return Math.floor(interval) + "일 전";
  interval = seconds / 3600; // 1시간
  if (interval > 1) return Math.floor(interval) + "시간 전";
  interval = seconds / 60; // 1분
  if (interval > 1) return Math.floor(interval) + "분 전";
  return Math.floor(seconds) + "초 전";
};

export default function HistoryPost({ data }: { data: ViewHistoryType }) {
  const post = data.posts;

  const postUrl = useMemo(() => {
    if (!post) {
      return "/";
    }

    if (post.model) {
      return `/?type=${post.post_type}&id=${post.id}&sub_type=${post.model}`;
    }
    return `/?type=${post.post_type}&id=${post.id}`;
  }, [post]);

  if (!post) {
    return (
      <article className="bg-white/40 border border-white/20 rounded-xl shadow-xl overflow-hidden">
        <div className="py-5 px-4 border-b border-gray-200 text-gray-500">
          (삭제되었거나 찾을 수 없는 게시물입니다.)
        </div>
      </article>
    );
  }

  const authorName = post.profiles?.display_name || "익명";
  const authorEmail = post.profiles?.email || "";
  const authorAvatar = post.profiles?.avatar_url;

  const displayTime = timeAgo(data.viewed_at);

  const boardTitle = getBoardTitle(post.post_type, post.model);

  return (
    <article className="bg-white/40 border border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
      <div className="relative py-3 px-4 border-b border-gray-200">
        <button
          className="absolute top-5 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 z-10"
          aria-label="기록 삭제"
        >
          <X size={18} />
        </button>

        {/* 1. 게시판 제목 */}
        <div className="text-sm font-bold mb-3">{boardTitle}</div>

        {/* 2. 메인 컨텐츠 (아바타 + 내용) */}
        <div className="flex gap-3 items-start">
          {/* 아바타 (왼쪽) */}
          <div className="relative w-10 h-10 bg-gray-300 rounded-full shrink-0 overflow-hidden">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                loading="eager"
                className="object-cover"
              />
            ) : (
              <span className="flex items-center justify-center h-full w-full text-gray-500 text-lg font-semibold">
                {(authorName[0] || "?").toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* 작성자 정보 */}
            <div className="flex items-center flex-wrap text-sm">
              <span className="font-medium mr-1.5">{authorName}</span>
              <span className="text-gray-500 text-xs mr-1.5">
                {authorEmail}
              </span>
              {authorEmail && (
                <span className="text-gray-500 text-xs mr-1.5">·</span>
              )}
              <span className="text-gray-500 text-xs">
                {timeAgo(post.created_at)}
              </span>
            </div>

            <Link href={postUrl} className="block mt-1">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {post.title}
              </h3>
            </Link>

            <div className="flex justify-between items-center mt-1.5">
              <p className="text-sm text-gray-700 truncate mr-30">
                {post.subtitle}
              </p>
              <p className="text-xs text-gray-500 whitespace-nowrap shrink-0 mr-3">
                {displayTime}에 마지막으로 봄
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
