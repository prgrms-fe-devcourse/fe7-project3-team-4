"use client";

import Link from "next/link";
import { NewsItemWithState } from "@/types";
import { Heart, Eye, Bookmark, BookmarkCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type NewsItemProps = {
  item: NewsItemWithState;
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
};

export default function NewsItem({
  item,
  onLikeToggle,
  onBookmarkToggle,
}: NewsItemProps) {
  const [realtimeLiked, setRealtimeLiked] = useState(item.isLiked);
  const [realtimeBookmarked, setRealtimeBookmarked] = useState(item.isBookmarked);
  const supabase = createClient();

  const siteName = item.site_name || "익명";
  const displayDate = (item.published_at || item.created_at).slice(0, 10);
  const thumb = Array.isArray(item.images) ? item.images[0] : null;
  const likeCount = item.like_count ?? 0;
  const viewCount = item.view_count ?? 0;
  const tags = item.tags || [];

  let model: "GPT" | "Gemini" | undefined = undefined;
  const lowerCaseTags = tags.map((t) => t.toLowerCase());
  if (lowerCaseTags.includes("gpt")) {
    model = "GPT";
  } else if (lowerCaseTags.includes("gemini")) {
    model = "Gemini";
  }

  // props가 변경되면 realtime 상태도 업데이트
  useEffect(() => {
    setRealtimeLiked(item.isLiked);
  }, [item.isLiked]);

  useEffect(() => {
    setRealtimeBookmarked(item.isBookmarked);
  }, [item.isBookmarked]);

  // Realtime 구독 설정
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 좋아요 상태 구독
      const likesChannel = supabase
        .channel(`news-likes-${item.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_news_likes",
            filter: `news_id=eq.${item.id},user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setRealtimeLiked(true);
            } else if (payload.eventType === "DELETE") {
              setRealtimeLiked(false);
            }
          }
        )
        .subscribe();

      // 북마크 상태 구독
      const bookmarksChannel = supabase
        .channel(`news-bookmarks-${item.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_news_bookmarks",
            filter: `news_id=eq.${item.id},user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setRealtimeBookmarked(true);
            } else if (payload.eventType === "DELETE") {
              setRealtimeBookmarked(false);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(likesChannel);
        supabase.removeChannel(bookmarksChannel);
      };
    };

    setupRealtimeSubscriptions();
  }, [item.id]);

  return (
    <article className="bg-white/40 border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 bg-gray-300 rounded-full shrink-0"></div>
            <div className="space-y-1 leading-none">
              <p>{siteName}</p>
              <p className="text-[#717182] text-sm">@user · {displayDate}</p>
            </div>
          </div>

          {model && (
            <div
              className={`h-[22px] text-xs font-semibold text-white px-3 py-1 ${
                model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
              } rounded-full`}
            >
              {model}
            </div>
          )}
        </div>

        <div className="my-5">
          <Link href={`/news/${item.id}`}>
            <div className="mb-6">
              <h3 className="text-[18px] font-semibold mb-6">{item.title}</h3>
            </div>

            {thumb ? (
              <div
                aria-label={item.title}
                className="block relative w-full aspect-video rounded-lg overflow-hidden bg-gray-300"
              >
                <Image
                  src={thumb}
                  alt={item.title}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="block w-full aspect-video rounded-lg bg-gray-200 items-center justify-center text-gray-500">
                뉴스 대표 이미지
              </div>
            )}
          </Link>
        </div>

        {tags.length > 0 && (
          <div className="space-x-2 text-sm text-[#248AFF]">
            {tags.map((tag, index) => (
              <span key={index}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-center gap-30 text-[#717182] py-6">
        <button
          onClick={() => onLikeToggle(item.id)}
          className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
            realtimeLiked
              ? "text-[#FF569B] bg-[#F7E6ED]"
              : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
          }`}
          aria-pressed={realtimeLiked}
          aria-label="좋아요"
        >
          <div className="flex gap-2 text-sm items-center ">
            <Heart size={18} fill={"none"} />
            <span className="font-semibold">{likeCount}</span>
          </div>
        </button>

        <span
          className="cursor-pointer py-1 px-2 rounded-md"
          aria-label="조회수"
        >
          <div className="flex gap-2 text-sm items-center">
            <Eye size={18} />
            <span className="font-semibold">{viewCount}</span>
          </div>
        </span>

        <button
          onClick={() => onBookmarkToggle(item.id)}
          className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
            realtimeBookmarked
              ? "text-[#6758FF] bg-[#D8D4FF]"
              : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
          }`}
          aria-pressed={realtimeBookmarked}
          aria-label="북마크"
        >
          {realtimeBookmarked ? (
            <BookmarkCheck size={18} fill="none" />
          ) : (
            <Bookmark size={18} fill="none" />
          )}
        </button>
      </div>
    </article>
  );
}