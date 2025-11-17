import Link from "next/link";
import PostActions from "./PostAction";
import { PostType } from "@/types/Post";
import Image from "next/image";
import { useMemo } from "react"; // [✅ 추가] useMemo 임포트
import { getTranslatedTag } from "@/utils/tagTranslator"; // [✅ 추가] 임포트

// [✅ 추가] Tab 타입 정의
type Tab = "전체" | "뉴스" | "프롬프트" | "자유" | "주간";
type SubType = "GPT" | "Gemini" | "텍스트" | "이미지";

export default function Post({
  data,
  onLikeToggle,
  onBookmarkToggle,
  activeTab, // [✅ 추가] activeTab prop
  subType,
}: {
  data: PostType;
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
  activeTab?: Tab; // [✅ 추가]
  subType?: SubType | string;
}) {
  const authorName = data.profiles?.display_name || "익명";
  const authorEmail = data.profiles?.email || "";
  const authorAvatar = data.profiles?.avatar_url;
  const displayDate = (data.created_at || "").slice(0, 10);

  // [✅ 수정] postUrl 로직 수정
  const postUrl = useMemo(() => {
    if (activeTab === "전체") {
      // '전체' 탭에서 클릭 시 'type=all'을 유지 (이전 수정)
      return `/?type=all&id=${data.id}`;
    }

    // '프롬프트' 또는 '주간' 탭에서 클릭 시 sub_type을 포함
    if (subType) {
      return `/?type=${data.post_type}&id=${data.id}&sub_type=${subType}`;
    }

    // 기본 동작 (e.g., '자유' 탭)
    return `/?type=${data.post_type}&id=${data.id}`;
  }, [activeTab, data.id, data.post_type, subType]); // [✅ 수정] subType 의존성 추가

  return (
    <article className="bg-white/40 border border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden dark:bg-white/20 dark:shadow-white/10 dark:hover:shadow-white/20">
      <div className="p-6 pb-0">
        {/* 상단: 작성자 정보 */}
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <div className="relative w-11 h-11 bg-gray-300 rounded-full shrink-0 overflow-hidden">
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
            <div className="space-y-1 leading-none">
              <p>{authorName}</p>
              <p className="text-[#717182] text-sm dark:text-[#A6A6DB]">
                {authorEmail ? `${authorEmail} · ` : "@user · "}
                {displayDate}
              </p>
            </div>
          </div>
          {data.model && (
            <div
              className={`h-[22px] text-xs font-semibold text-white px-3 py-1 ${
                data.model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
              } rounded-full`}
            >
              {data.model}
            </div>
          )}
        </div>

        <Link href={postUrl} className="block my-5 space-y-4">
          {/* 중간: 제목 */}
          <h3 className="text-lg font-semibold">{data.title}</h3>
          {/* 썸네일 이미지 (thumbnail) - 존재할 경우에만 렌더링 */}
          {data.thumbnail && (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg">
              <Image
                src={data.thumbnail}
                alt={data.title}
                fill
                className="object-cover"
                loading="lazy"
              />
            </div>
          )}
          {/* 부제목 (subtitle) - 존재할 경우에만 렌더링 */}
          {data.subtitle && (
            <div className="line-clamp-3 text-gray-700 dark:text-[#A6A6DB]">
              {data.subtitle}
            </div>
          )}
        </Link>

        {/* 해시태그 */}
        {data.hashtags && data.hashtags.length > 0 && (
          <div className="space-x-2 text-sm text-[#248AFF] mt-4">
            {data.hashtags.map((tag, i) => (
              <span key={i}>#{getTranslatedTag(tag)}</span> // [✅ 수정]
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <PostActions
        postId={data.id}
        likeCount={data.like_count}
        commentCount={data.comment_count}
        isLiked={data.isLiked}
        isBookmarked={data.isBookmarked}
        onLikeToggle={onLikeToggle}
        onBookmarkToggle={onBookmarkToggle}
      />
    </article>
  );
}
