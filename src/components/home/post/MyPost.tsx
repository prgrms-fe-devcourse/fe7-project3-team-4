import Link from "next/link";
import PostActions from "./PostAction";
import { PostType } from "@/types/Post";
import Image from "next/image";
import { getTranslatedTag } from "@/utils/tagTranslator";
import UserAvatar from "@/components/shop/UserAvatar";

export default function MyPost({
  data,
  onLikeToggle,
}: {
  data: PostType;
  onLikeToggle?: (id: string) => void;
}) {
  const authorName = data.profiles?.display_name || "익명";
  const authorEmail = data.profiles?.email || "";
  const authorAvatar = data.profiles?.avatar_url;
  // 🌟 2. 뱃지 ID 추출
  const authorEquippedBadgeId = data.profiles?.equipped_badge_id;
  const displayDate = (data.created_at || "").slice(0, 10);
  const postUrl = `/?type=${data.post_type}&id=${data.id}`;

  return (
    <article className="bg-white/40 border border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden dark:bg-white/20 dark:shadow-white/10 dark:hover:shadow-white/20">
      <div className="p-6 pb-0">
        {/* 상단: 작성자 정보 */}
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            {/* 🌟 3. 기존 <img> div를 UserAvatar 컴포넌트로 교체 */}
            <UserAvatar
              src={authorAvatar}
              alt={authorName}
              equippedBadgeId={authorEquippedBadgeId}
              className="w-11 h-11 shrink-0" // 👈 기존과 동일한 크기 적용
            />

            <div className="space-y-1 leading-none">
              <p>{authorName}</p>
              <p className="text-[#717182] text-sm">
                {authorEmail ? `${authorEmail} · ` : "@user · "}
                {displayDate}
              </p>
            </div>
          </div>
        </div>

        <Link href={postUrl} className="block my-5 space-y-4">
          {/* 중간: 제목 */}
          <h3 className="text-[18px] font-semibold">{data.title}</h3>
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
            <div className="line-clamp-3 text-gray-700">{data.subtitle}</div>
          )}
        </Link>

        {/* 해시태그 */}
        {data.hashtags && data.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm text-[#248AFF] mt-4">
            {data.hashtags.map((tag, i) => (
              <span key={i}>#{getTranslatedTag(tag)}</span>
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 - onBookmarkToggle 없이 viewCount 전달 */}
      <PostActions
        postId={data.id}
        likeCount={data.like_count}
        commentCount={data.comment_count}
        viewCount={data.view_count}
        isLiked={data.isLiked}
        onLikeToggle={onLikeToggle}
      />
    </article>
  );
}
