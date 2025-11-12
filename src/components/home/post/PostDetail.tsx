import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import Comments from "./Comments";
import RichTextRenderer from "@/components/common/RichTextRenderer";
import { PostType } from "@/types/Post";
import Image from "next/image";
import CommentForm from "./CommentForm";
import PostActions from "./PostAction"; // ✅ PostActions 컴포넌트 import
import { createClient } from "@/utils/supabase/client";
export type PostComment = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  reply_count: number;
  has_reply: boolean;
  display_name: string;
  email: string;
  avatar_url?: string;
  user_id: string;
};
interface PostDetailProps {
  post: PostType;
  onBack: () => void;
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
}
export default function PostDetail({
  post,
  onLikeToggle,
  onBookmarkToggle,
  onBack,
}: PostDetailProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [sortOrder, setSortOrder] = useState<"latest" | "popular">("latest");
  const supabase = createClient();
  // 작성자 정보
  const authorName = post.profiles?.display_name || "익명";
  const authorEmail = post.profiles?.email || "";
  const authorAvatar = post.profiles?.avatar_url || null;
  const displayDate = (post.created_at || "").slice(0, 10);
  // 댓글 조회 함수
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        like_count,
        reply_count,
        has_reply,
        user_id,
        profiles:user_id (
          display_name,
          email,
          avatar_url,
          bio
        )
      `
      )
      .eq("target_id", post.id)
      .is("parent_id", null)
      .order(sortOrder === "latest" ? "created_at" : "like_count", {
        ascending: false,
      });
    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }
    if (data) {
      const formattedComments: PostComment[] = data.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        like_count: comment.like_count || 0,
        reply_count: comment.reply_count || 0,
        has_reply: comment.has_reply || false,
        display_name: comment.profiles?.display_name || "익명",
        email: comment.profiles?.email || "user",
        bio: comment.profiles?.bio || null,
        avatar_url: comment.profiles?.avatar_url || null,
        user_id: comment.user_id,
      }));
      setComments(formattedComments);
    }
  };
  // 초기 로드 및 정렬 변경 시 댓글 조회
  useEffect(() => {
    fetchComments();
  }, [post.id, sortOrder]);
  // ✅ Realtime: comments 구독
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `target_id=eq.${post.id}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);
  // ✅ Realtime: posts.comment_count 구독
  useEffect(() => {
    const channel = supabase
      .channel(`post:${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${post.id}`,
        },
        (payload) => {
          // comment_count 변경사항 반영
          const updatedPost = payload.new as {
            comment_count: number;
            like_count: number;
          };
          // post 객체는 props이므로 불변, 필요시 부모에게 알림
          console.log(
            "실시간 업데이트:",
            updatedPost.comment_count,
            updatedPost.like_count
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);
  // ✅ 댓글 작성 후 콜백
  const handleCommentAdded = () => {
    fetchComments();
  };
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
          <div className="flex justify-between">
            {/* 작성자 정보 */}
            <div className="flex gap-3 items-center">
              <div className="relative w-11 h-11 bg-gray-300 rounded-full shrink-0 overflow-hidden">
                {authorAvatar ? (
                  <Image
                    src={authorAvatar}
                    alt={authorName}
                    fill
                    className="object-cover"
                    sizes="44px"
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
            <div className="mb-6 space-y-4">
              <p className="text-[18px] font-medium">{post.title}</p>
              <div className="mt-4">
                <RichTextRenderer content={post.content} showImage={true} />
              </div>
            </div>
          </div>
          {/* 태그 */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-row flex-wrap gap-2 mt-5 text-sm text-[#248AFF]">
              {post.hashtags.map((tag, i) => (
                <span key={i}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
              ))}
            </div>
          )}
        </div>
        {/* ✅ PostActions 컴포넌트 사용 - 좋아요/북마크 핸들러 연결 */}
        <PostActions
          postId={post.id}
          likeCount={post.like_count}
          commentCount={comments.length} // ✅ 실제 댓글 수 사용
          isLiked={post.isLiked}
          isBookmarked={post.isBookmarked}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
        />
        {/* 작성자 소개 */}
        <div>
          <p className="ml-2 mb-2 text-ms font-medium">작성자 소개</p>
          <div className="flex justify-between items-start gap-3 p-3 bg-white rounded-lg">
            <div className="flex-1 flex gap-3">
              <div className="relative w-11 h-11 bg-gray-300 rounded-full overflow-hidden">
                {authorAvatar ? (
                  <Image
                    src={authorAvatar}
                    alt={authorName}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                ) : (
                  <span className="flex items-center justify-center h-full w-full text-gray-500 text-lg font-semibold">
                    {(authorName[0] || "?").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-1 leading-none">
                <p>
                  {authorName}
                  <span className="text-[#717182] text-sm ml-1">
                    {authorEmail || "@user"}
                  </span>
                </p>
                <p className="text-sm line-clamp-2">
                  {post.profiles?.bio || "자기소개가 없습니다."}
                </p>
              </div>
            </div>
            <button className="cursor-pointer leading-none text-[#6758FF] bg-[#6758FF]/10 rounded-lg py-1.5 px-2 text-sm">
              + 팔로우
            </button>
          </div>
        </div>
        {/* ✅ 댓글 입력 창 - onCommentAdded 콜백 전달 */}
        <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
        {/* 댓글 영역 */}
        <div className="space-y-5">
          <div className="p-1 flex items-center gap-3 py-1 px-4 bg-white rounded-lg border border-[#F2F2F4]">
            <ArrowUpDown size={12} />
            <div className="text-sm space-x-1 p-0.5 bg-[#EEEEF0] rounded-lg">
              <button
                onClick={() => setSortOrder("latest")}
                className={`cursor-pointer py-1 px-3 rounded-lg ${
                  sortOrder === "latest" ? "bg-white shadow" : ""
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => setSortOrder("popular")}
                className={`cursor-pointer py-1 px-3 rounded-lg ${
                  sortOrder === "popular" ? "bg-white shadow" : ""
                }`}
              >
                인기순
              </button>
            </div>
          </div>
          <div className="px-9">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                첫 댓글을 작성해보세요!
              </p>
            ) : (
              comments.map((comment) => (
                <Comments
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  onCommentDeleted={fetchComments}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
