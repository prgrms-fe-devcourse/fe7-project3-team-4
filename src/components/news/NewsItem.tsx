"use client";

import Link from "next/link";
import { NewsItemWithState } from "@/types";
import { formatTimeAgo } from "@/utils/formatTimeAgo";

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
  // [클린 코드] 기본값 처리를 통한 안정성 확보
  const siteName = item.site_name || "익명";
  const timeAgo = formatTimeAgo(item.published_at || item.created_at);
  const thumb = Array.isArray(item.images) ? item.images[0] : null;
  const likeCount = item.like_count ?? 0;
  const viewCount = item.view_count ?? 0;
  const tags = item.tags || [];
  return (
    <article className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* 카드 헤더 (사이트 정보) */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 shrink-0">
          {/* [클린 코드] siteName이 빈 문자열일 경우 대비 */}
          {(siteName[0] || "?").toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-sm">{siteName}</div>
          {/* [리뷰] '@user'가 하드코딩되어 있습니다. 의도된 것인지 확인 필요. */}
          <div className="text-xs text-gray-400">@user · {timeAgo}</div>
        </div>
      </div>

      {/* 본문 (제목) */}
      <div className="px-4 pb-2">
        {/* [리뷰] scroll={false}는 Next.js 13+ App Router에서 기본 동작이므로 
            스크롤 복원을 수동으로 제어(ClientScrollRestorer)하지 않는다면 제거 가능 */}
        <Link href={`/news/${item.id}`} scroll={false}>
          <h3 className="font-semibold text-base mb-2 hover:underline">{item.title}</h3>
        </Link>
      </div>

      {/* 썸네일 이미지 */}
      <div className="px-4 pt-0">
        {thumb ? (
          <Link href={`/news/${item.id}`} className="block" aria-label={item.title}>
            <div className="bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden aspect-video">
              <img
                src={thumb}
                alt={item.title} // [클린 코드] alt 속성 제공
                className="w-full h-full object-cover"
                loading="lazy" // [클린 코드] 지연 로딩
              />
            </div>
          </Link>
        ) : (
          // [클린 코드] 썸네일 없을 때 플레이스홀더
          <div className="h-64 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg aspect-video">
            뉴스 대표 이미지
          </div>
        )}
      </div>

      {/* [수정] DB에서 불러온 태그 렌더링 */}
      {tags.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span 
              key={index} 
              className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium"
            >
              {/* 태그에 #이 없다면 붙여줌 */}
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {/* 푸터 (좋아요, 조회수, 북마크) */}
      <div className="p-4 flex items-center justify-center gap-35 text-sm text-gray-600">
        <button
          onClick={() => onLikeToggle(item.id)}
          className={`flex items-center gap-1.5 p-1 px-3 rounded-lg transition-colors ${
            item.isLiked
              ? "bg-pink-100/70 text-pink-600"
              : "text-gray-500 hover:bg-gray-50/70"
          }`}
          aria-pressed={item.isLiked}
          aria-label="좋아요"
        >
          <img
            src={item.isLiked ? "/like-clicked.svg" : "/like.svg"}
            alt="" // [클린 코드] 장식용 이미지는 alt=""
            className="w-5 h-5"
          />
          <span className="font-semibold">{likeCount}</span>
        </button>

        <span className="flex items-center gap-1.5 text-gray-500" aria-label="조회수">
          <img src="/view-count.svg" alt="" className="w-5 h-5" />
          <span className="font-semibold">{viewCount}</span>
        </span>

        <button
          onClick={() => onBookmarkToggle(item.id)}
          className={`flex items-center gap-1.5 p-1 px-3 rounded-lg transition-colors ${
            item.isBookmarked
              ? "bg-[#D8D4FF] text-indigo-600"
              : "text-gray-400 hover:text-blue-600"
          }`}
          aria-pressed={item.isBookmarked}
          aria-label="북마크"
        >
          <img
            src={
              item.isBookmarked
                ? "/bookmark-clicked.svg"
                : "/bookmark.svg"
            }
            alt=""
            className="w-5 h-5"
          />
        </button>
      </div>
    </article>
  );
}