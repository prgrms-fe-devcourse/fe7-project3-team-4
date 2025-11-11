import {
  ArrowLeft,
  ArrowUpDown,
  Bookmark,
  Heart,
  MessageSquare,
} from "lucide-react";
import Comments from "./Comments";
import RichTextRenderer from "@/components/common/RichTextRenderer";
import { PostType } from "@/types/Post";
import Image from "next/image";
import CommentForm from "./CommentForm";

export const MOCK_COMMENTS: PostComment[] = [
  // ... 기존 MOCK_COMMENTS 내용 ...
];

export default function PostDetail({
  post,
  onBack,
}: {
  post: PostType;
  onBack: () => void;
}) {
  const authorName = post.profiles?.display_name || "익명";
  const authorEmail = post.profiles?.email || "";
  const authorAvatar = post.profiles?.avatar_url;
  const displayDate = (post.created_at || "").slice(0, 10);

  return (
    <div className="space-y-6 pb-6">
      <button
        onClick={onBack}
        className="leading-none group cursor-pointer flex items-center gap-2 text-[#6758FF] hover:underline"
      >
        <ArrowLeft className="arrow-wiggle" />
        뒤로
      </button>

      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
        {/* 게시글 정보 */}
        <div className="pb-7">
          {/* 작성자 정보 */}
          <div className="flex justify-between">
            <div className="flex gap-3 items-center">
              {/* 프로필 이미지 */}
              <div className="relative w-11 h-11 bg-gray-300 rounded-full shrink-0 overflow-hidden">
                {authorAvatar ? (
                  <Image
                    src={authorAvatar}
                    alt={authorName}
                    fill
                    className="object-cover"
                    // sizes="44px"
                  />
                ) : (
                  <span className="flex items-center justify-center h-full w-full text-gray-500 text-lg font-semibold">
                    {(authorName[0] || "?").toUpperCase()}
                  </span>
                )}
              </div>
              {/* 이름, 이메일, 작성 시간 */}
              <div className="space-y-1 leading-none">
                <p>{authorName}</p>
                <p className="text-[#717182] text-sm">
                  {authorEmail ? `${authorEmail} · ` : "@user · "}
                  {displayDate}
                </p>
              </div>
            </div>
            {post.model && (
              <div
                className={`h-[22px] text-xs font-semibold text-white px-3 py-1 ${
                  post.model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
                } rounded-full`}
              >
                {post.model}
              </div>
            )}
          </div>
          {/* 게시글 내용 */}
          <div className="my-5">
            {/* 제목 */}
            <div className="mb-6 space-y-4">
              <p className="text-[18px] font-medium">{post.title}</p>
              {/* 전체 콘텐츠 렌더링 (텍스트 + 이미지 모두) */}
              <div className="mt-4">
                <RichTextRenderer content={post.content} showImage={true} />
              </div>
            </div>
          </div>
          {/* 태그들 */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="space-x-2 text-sm text-[#248AFF]">
              {post.hashtags.map((tag, i) => (
                <span key={i}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
              ))}
            </div>
          )}
        </div>
        {/* 아래 버튼들 */}
        <div className="flex justify-center gap-30 text-[#717182]">
          <button className="cursor-pointer py-1 px-2 rounded-md hover:text-[#FF569B] hover:bg-[#F7E6ED]">
            <div className="flex gap-2 text-sm items-center ">
              <Heart size={18} />
              <span>{post.like_count ?? 0}</span>
            </div>
          </button>
          <button className="cursor-pointer py-1 px-2 rounded-md hover:bg-gray-200">
            <div className="flex gap-2 text-sm items-center">
              <MessageSquare size={18} />
              <span>{post.comment_count ?? 0}</span>
            </div>
          </button>
          <button
            className={`cursor-pointer py-1 px-2 rounded-md hover:text-[#6758FF] hover:bg-[#D8D4FF] ${
              post.isBookmarked ? "text-[#6758FF] bg-[#D8D4FF]" : ""
            }`}
          >
            <Bookmark size={18} />
          </button>
        </div>
        {/* 작성자 소개 */}
        <div className="mt-7">
          <p className="ml-2 mb-2 text-ms font-medium">작성자 소개</p>
          <div className="flex justify-between items-start gap-3 p-3 bg-white rounded-lg">
            <div className="flex-1 flex gap-3">
              {/* 프로필 이미지 */}
              <div className="w-11 h-11 bg-gray-300 rounded-full"></div>
              {/* 이름, 이메일, 소개 */}
              <div className="flex-1 space-y-1 leading-none">
                <p>
                  {authorName}
                  <span className="text-[#717182] text-sm ml-1">
                    {authorEmail || "@user"}
                  </span>
                </p>
                <p className="text-sm line-clamp-2">
                  {post.profiles?.display_name || "자기소개가 없습니다."}
                </p>
              </div>
            </div>
            <button className="cursor-pointer leading-none text-[#4888FF] bg-[#EBF2FF] rounded-lg py-1.5 px-2 text-sm">
              + 팔로우
            </button>
          </div>
        </div>
        {/* 댓글 입력 창 */}
        <CommentForm postId={post.id} />
        {/* 댓글 영역 */}
        <div className="space-y-5">
          {/* 최신순 인기순 버튼 */}
          <div className="p-1 flex items-center gap-3 py-1 px-4 bg-white rounded-lg border border-[#F2F2F4]">
            <ArrowUpDown size={12} />
            <div className="text-sm space-x-1 p-0.5 bg-[#EEEEF0] rounded-lg">
              <button className="cursor-pointer py-1 px-3 rounded-lg bg-white shadow">
                최신순
              </button>
              <button className="cursor-pointer py-1 px-3 rounded-lg">
                인기순
              </button>
            </div>
          </div>
          {/* 댓글 영역 */}
          <div className="px-9">
            {/* 댓글 */}
            {MOCK_COMMENTS.map((comment) => (
              <Comments key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
