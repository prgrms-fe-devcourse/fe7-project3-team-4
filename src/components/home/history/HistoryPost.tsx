"use client"; // [★] 1. 클라이언트 컴포넌트로 선언

import Link from "next/link";
import Image from "next/image";
import { ViewHistoryType } from "@/types/Post";
// import { getTranslatedTag } from "@/utils/tagTranslator"; // (현재 코드에서 사용되지 않음)
import { useMemo, useState } from "react"; // [★] 2. useState 추가
import { X } from "lucide-react";
import { useRouter } from "next/navigation"; // [★] 3. useRouter 추가
import { createClient } from "@/utils/supabase/client"; // [★] 4. supabase/client 추가

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

  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const postUrl = useMemo(() => {
    if (!post) {
      return "/";
    }

    if (post.model) {
      return `/?type=${post.post_type}&id=${post.id}&sub_type=${post.model}`;
    }
    return `/?type=${post.post_type}&id=${post.id}`;
  }, [post]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("user_post_views")
      .delete()
      .eq("id", data.id);

    if (error) {
      console.error("조회 내역 삭제 오류:", error);
      alert("기록 삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    } else {
      router.refresh();
    }
  };

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
  const authorAvatar = post.profiles?.avatar_url;

  const displayTime = timeAgo(data.viewed_at);

  const boardTitle = getBoardTitle(post.post_type, post.model);

  return (
    <article className="bg-white/40 border border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden dark:bg-white/20 dark:shadow-white/10 dark:hover:shadow-white/20">
      <div className="relative p-4">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="cursor-pointer absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed dark:text-[#A6A6DB]"
          aria-label="기록 삭제"
        >
          <X size={18} />
        </button>

        <div className="text-xl font-semibold mb-3">{boardTitle}</div>

        <div className="flex gap-3 items-start">
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
            <div className="flex items-center flex-wrap text-sm">
              <span className="font-medium mr-1.5">{authorName}</span>
              <span className="text-gray-500 text-xs ml-2 dark:text-[#A6A6DB]">
                {timeAgo(post.created_at)}
              </span>
            </div>

            <Link href={postUrl} className="block mt-1">
              <h3 className="text-lg truncate">{post.title}</h3>

              <div className="flex justify-between items-center mt-1.5">
                <p className="text-sm text-gray-700 truncate mr-30 dark:text-gray-300">
                  {post.subtitle}
                </p>
                <p className="text-xs text-gray-500 whitespace-nowrap shrink-0 mr-3 dark:text-[#A6A6DB]">
                  {displayTime}에 마지막으로 봄
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
