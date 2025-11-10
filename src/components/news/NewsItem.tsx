"use client";

import Link from "next/link";
import { NewsItemWithState } from "@/types";
import { Heart, Eye, Bookmark } from "lucide-react";
import Image from "next/image";

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
  const siteName = item.site_name || "익명";
  // [수정] Post.tsx와 같이 날짜 형식을 slice(0, 10)로 변경
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

  return (
    <article className="bg-white/40 border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 bg-gray-300 rounded-full shrink-0">
            </div>
            <div className="space-y-1 leading-none">
              <p>{siteName}</p>
              <p className="text-[#717182] text-sm">
                @user · {displayDate}
              </p>
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
          <div className="mb-6 space-y-4">
            <Link href={`/news/${item.id}`}>
              <h3 className="text-[18px] font-semibold hover:underline">
                {item.title}
              </h3>
            </Link>
          </div>

          {thumb ? (
            <Link
              href={`/news/${item.id}`}
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
            </Link>
          ) : (
            <div className="block w-full aspect-video rounded-lg bg-gray-200 items-center justify-center text-gray-500">
              뉴스 대표 이미지
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="space-x-2 text-sm text-[#248AFF]">
            {tags.map((tag, index) => (
              <span key={index}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
            ))}
          </div>
        )}
      </div>{" "}
      <div className="flex justify-center gap-30 text-[#717182] py-6">
        <button
          onClick={() => onLikeToggle(item.id)}
          className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
            item.isLiked
              ? "text-[#FF569B] bg-[#F7E6ED]"
              : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
          }`}
          aria-pressed={item.isLiked}
          aria-label="좋아요"
        >
          <div className="flex gap-2 text-sm items-center ">
            <Heart size={18} />
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
            item.isBookmarked
              ? "text-[#6758FF] bg-[#D8D4FF]"
              : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
          }`}
          aria-pressed={item.isBookmarked}
          aria-label="북마크"
        >
          <Bookmark size={18} />
        </button>
      </div>
    </article>
  );
}