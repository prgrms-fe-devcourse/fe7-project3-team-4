"use client";

import Link from "next/link";
import { NewsItemWithState } from "@/types";
// [수정] formatTimeAgo 임포트 제거 (Post.tsx와 같이 slice 사용)
// import { formatTimeAgo } from "@/utils/formatTimeAgo";
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
      {/* [수정] 헤더 컨테이너: Post.tsx와 동일하게 p-6 pb-0 적용 */}
      <div className="p-6 pb-0">
        {/* [수정] 작성자 정보: Post.tsx와 동일하게 justify-between 적용 */}
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            {/* [수정] 프로필 이미지: Post.tsx와 동일하게 w-11 h-11 bg-gray-300 적용 */}
            <div className="w-11 h-11 bg-gray-300 rounded-full shrink-0">
              {/* (기존 아이콘 제거) */}
            </div>
            {/* [수정] 텍스트 영역: Post.tsx와 동일하게 space-y-1 leading-none 적용 */}
            <div className="space-y-1 leading-none">
              {/* [수정] 작성자명: Post.tsx와 동일하게 p 태그 및 기본 폰트 적용 */}
              <p>{siteName}</p>
              {/* [수정] 이메일/날짜: Post.tsx와 동일하게 text-[#717182] text-sm 및 날짜 형식 적용 */}
              <p className="text-[#717182] text-sm">
                {/* '@user'는 임시값입니다. 필요시 item.site_name 등으로 대체하세요. */}
                @user · {displayDate}
              </p>
            </div>
          </div>

          {/* 뱃지 (Post.tsx와 동일) */}
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

        {/* [수정] 본문 컨테이너: Post.tsx와 동일하게 my-5 적용 */}
        <div className="my-5">
          {/* [수정] 제목: Post.tsx와 동일하게 mb-6 space-y-4 및 text-[18px] 적용 */}
          <div className="mb-6 space-y-4">
            <Link href={`/news/${item.id}`} scroll={false}>
              <h3 className="text-[18px] font-semibold hover:underline">
                {item.title}
              </h3>
            </Link>
          </div>

          {/* [수정] 썸네일 이미지: Post.tsx와 동일하게 h-auto 및 aspect-video 제거 */}
          {thumb ? (
            <Link
              href={`/news/${item.id}`}
              aria-label={item.title}
              // 1. 부모 <Link>에 relative, 크기(aspect-video), overflow,
              //    백그라운드, 모서리 둥글게 처리를 합니다.
              className="block relative w-full aspect-video rounded-lg overflow-hidden bg-gray-300"
            >
              <Image
                src={thumb}
                alt={item.title}
                // 2. fill 속성으로 부모를 꽉 채웁니다. (width/height 불필요)
                fill
                // 3. object-cover만 남깁니다. (w-full, h-auto 등 제거)
                className="object-cover"
                loading="lazy"
                // 4. (권장) fill 사용 시, 최적화를 위해 sizes를 제공합니다.
                //    (예: 모바일에선 100%, 데스크탑에선 50% 너비)
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </Link>
          ) : (
            // 5. [중요] 이미지가 없을 때의 placeholder도
            //    위 <Link>와 동일한 크기(aspect-video)를 가져야
            //    레이아웃 밀림(CLS)이 발생하지 않습니다.
            <div className="block w-full aspect-video rounded-lg bg-gray-200 items-center justify-center text-gray-500">
              뉴스 대표 이미지
            </div>
          )}
        </div>

        {/* [수정] 태그: Post.tsx와 동일하게 p-6 pb-0 컨테이너 내부(my-5 다음)로 이동 */}
        {tags.length > 0 && (
          <div className="space-x-2 text-sm text-[#248AFF]">
            {tags.map((tag, index) => (
              <span key={index}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
            ))}
          </div>
        )}
      </div>{" "}
      {/* p-6 pb-0 컨테이너 종료 */}
      {/* 푸터 (Post.tsx와 동일) */}
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
