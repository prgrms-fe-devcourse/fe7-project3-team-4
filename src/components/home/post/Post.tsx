import Link from "next/link";
import PostActions from "./PostAction";
import RichTextRenderer from "@/components/common/RichTextRenderer";
import { PostType } from "@/types/Post";
import Image from "next/image";
export default function Post({
  data,
  onLikeToggle,
  onBookmarkToggle,
}: {
  data: PostType;
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
}) {
  const authorName = data.profiles?.display_name || "익명";
  const authorEmail = data.profiles?.email || "";
  const authorAvatar = data.profiles?.avatar_url;
  const displayDate = (data.created_at || "").slice(0, 10);
  return (
    <article className="bg-white/40 border border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
      <Link href={`/?type=${data.post_type}&id=${data.id}`} className="block">
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
                <p className="text-[#717182] text-sm">
                  {authorEmail ? `${authorEmail} · ` : "@user · "}
                  {displayDate}
                </p>
              </div>
            </div>
          </div>
          {/* 중간: 제목, 텍스트 미리보기 */}
          <div className="my-5">
            <h3 className="text-[18px] font-semibold hover:underline">
              {data.title}
            </h3>
            {/* 텍스트 미리보기 (이미지 제외, 3줄 제한) */}
            <div className="line-clamp-3 text-gray-700">
              <RichTextRenderer content={data.content} showImage={false} />
            </div>
            {/* 이미지 렌더링 - 이미지가 있을 때만 표시 */}
            <RichTextRenderer
              content={data.content}
              imageOnly={true}
              postId={data.id}
              postType={data.post_type}
              title={data.title}
            />
          </div>
          {/* 해시태그 */}
          {data.hashtags && data.hashtags.length > 0 && (
            <div className="space-x-2 text-sm text-[#248AFF]">
              {data.hashtags.map((tag, i) => (
                <span key={i}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
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
