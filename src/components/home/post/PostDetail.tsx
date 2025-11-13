"use client";

import { ArrowLeft, ArrowUpDown, Edit, Trash } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Comments from "./Comments";
import RichTextRenderer from "@/components/common/RichTextRenderer";
import { PostType } from "@/types/Post";
import Image from "next/image";
import CommentForm from "./CommentForm";
import PostActions from "./PostAction";
import { createClient } from "@/utils/supabase/client";
import PromptDetail from "./PromptDetail";
import Link from "next/link";
import {
  extractImageSrcArr,
  pickNthParagraphDoc,
} from "@/utils/extractTextFromJson";
import { useFollow } from "@/context/FollowContext";
import { useRouter } from "next/navigation";

type RawComment = {
  id: string;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
  like_count: number | null;
  reply_count: number | null;
  has_reply: boolean;
  parent_id?: string | null;
  user_id: string | null;
  profiles: {
    display_name: string | null;
    email: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  } | null;
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
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // ✅ Follow Context 사용
  const { isFollowing, toggleFollow, currentUserId } = useFollow();

  const authorName = post.profiles?.display_name || "익명";
  const authorEmail = post.profiles?.email || "";
  const authorAvatar = post.profiles?.avatar_url || null;
  const authorUserId = post.user_id;

  // 팔로우 상태는 Context에서 가져옴
  const isAuthorFollowing = isFollowing(authorUserId);

  useEffect(() => {
    const incrementViewCount = async () => {
      const { error } = await supabase.rpc("increment_view_count", {
        post_id: post.id,
      });

      if (error) {
        console.error("Error incrementing view count:", error);
      }
    };

    incrementViewCount();
  }, [post.id, supabase]);

  const fetchComments = useCallback(async () => {
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
        parent_id,
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
      const formattedComments: PostComment[] = data.map(
        (comment: RawComment) => ({
          id: comment.id,
          content: comment.content ?? "",
          created_at: comment.created_at ?? "",
          updated_at: comment.updated_at ?? null,
          like_count: comment.like_count ?? 0,
          reply_count: comment.reply_count ?? 0,
          has_reply: comment.has_reply ?? false,
          parent_id: comment.parent_id ?? null,
          user_id: comment.user_id ?? "",
          profiles: comment.profiles
            ? {
                display_name: comment.profiles.display_name ?? "익명",
                email: comment.profiles.email ?? "user",
                avatar_url: comment.profiles.avatar_url ?? null,
                bio: comment.profiles.bio ?? null,
              }
            : {
                display_name: "익명",
                email: "user",
              },
        })
      );
      setComments(formattedComments);
    }
  }, [post.id, sortOrder, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 댓글 및 게시글 Realtime 구독
  useEffect(() => {
    const commentsChannel = supabase
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

    const postChannel = supabase
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
          const updatedPost = payload.new as {
            comment_count: number;
            like_count?: number;
          };
          console.log(
            "[PostDetail] 게시글 실시간 업데이트:",
            updatedPost.comment_count,
            updatedPost.like_count
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(postChannel);
    };
  }, [post.id, supabase, fetchComments]);

  // ✅ Follow Context의 toggleFollow 사용
  const handleFollowToggle = async () => {
    if (!currentUserId || !authorUserId) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (currentUserId === authorUserId) {
      alert("자기 자신을 팔로우할 수 없습니다.");
      return;
    }

    setIsFollowLoading(true);

    try {
      await toggleFollow(authorUserId);
    } catch (error) {
      console.error("Error toggling follow:", error);

      // 사용자에게 에러 메시지 표시
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("팔로우 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleCommentAdded = () => {
    fetchComments();
  };

  /* 게시글 삭제시 댓글까지 모두 삭제 */
  const handleDeletePost = async () => {
    if (!currentUserId) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (currentUserId !== post.user_id) {
      alert("본인만 삭제할 수 있습니다.");
      return;
    }

    const confirmed = window.confirm(
      "이 게시글과 이 게시글에 달린 모든 댓글이 삭제됩니다.\n정말 삭제하시겠어요?"
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      // 이 게시글에 달린 모든 댓글 삭제 (대댓글 포함)
      const { error: commentsError } = await supabase
        .from("comments")
        .delete()
        .eq("target_id", post.id);

      if (commentsError) {
        console.error("Error deleting comments:", commentsError);
        alert("댓글 삭제 중 오류가 발생했습니다.");
        setIsDeleting(false);
        return;
      }

      // 게시글 삭제
      const { error: postError } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("user_id", currentUserId);

      if (postError) {
        console.error("Error deleting post:", postError);
        alert("게시글 삭제 중 오류가 발생했습니다.");
        setIsDeleting(false);
        return;
      }

      alert("게시글이 삭제되었습니다.");
      router.push(`/?type=${post.post_type}`); // 삭제 후 해당 게시글의 post_type으로 이동
      router.refresh();
    } catch (error) {
      console.error("Unexpected error while deleting post:", error);
      alert("삭제 처리 중 알 수 없는 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="leading-none group cursor-pointer flex items-center gap-2 text-[#6758FF] hover:underline"
        >
          <ArrowLeft className="arrow-wiggle" />
          뒤로
        </button>
        {/* 내가 작성한 게시글에서만 보이도록 */}
        {post.user_id === currentUserId && (
          <div className="flex gap-4 px-2 items-center">
            {/* 수정 */}
            <button className="leading-none cursor-pointer flex items-center gap-2 text-[#555555]">
              <Edit />
            </button>
            {/* 삭제 */}
            <button
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="leading-none cursor-pointer flex items-center gap-2 text-[#ff4646]"
            >
              <Trash />
            </button>
          </div>
        )}
      </div>

      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
        <div className="pb-7">
          <div className="flex justify-between">
            <div className="flex gap-3 items-center">
              <Link
                href={`/profile?userId=${post.user_id}`}
                className="relative w-11 h-11 bg-gray-300 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
              >
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
              </Link>
              <div className="flex-1 space-y-1 leading-none">
                <p>
                  {authorName}
                  <span className="text-[#717182] text-sm ml-1">
                    {authorEmail || "@user"}
                  </span>
                </p>
                <p className="text-sm line-clamp-1">
                  {post.profiles?.bio || "자기소개가 없습니다."}
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

          <div className="mt-5">
            <div className="space-y-4">
              <p className="text-[18px] font-medium">{post.title}</p>
              {post.thumbnail === "" ? null : (
                <div className="relative">
                  <Image
                    src={extractImageSrcArr(post.content)[0]}
                    alt={post.title}
                    width={800}
                    height={800}
                    className="object-cover"
                  />
                </div>
              )}
              <RichTextRenderer
                content={pickNthParagraphDoc(post.content, 0)}
                showImage={false}
              />
            </div>
          </div>

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 text-sm text-[#248AFF]">
              {post.hashtags.map((tag, i) => (
                <span key={i}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
              ))}
            </div>
          )}
        </div>

        <PostActions
          postId={post.id}
          likeCount={post.like_count}
          commentCount={comments.length}
          isLiked={post.isLiked}
          isBookmarked={post.isBookmarked}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
        />
      </div>

      {post.post_type === "prompt" ||
        (post.post_type === "weekly" && (
          <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
            <PromptDetail post={post} />
          </div>
        ))}

      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
        <div>
          <p className="ml-2 mb-2 text-ms font-medium">작성자 소개</p>
          <div className="flex justify-between items-start gap-3 p-3 bg-white rounded-lg">
            <div className="flex-1 flex gap-3">
              <Link
                href={`/profile?userId=${post.user_id}`}
                className="relative w-11 h-11 bg-gray-300 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
              >
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
              </Link>
              <div className="flex-1 space-y-1 leading-none">
                <p>
                  {authorName}
                  <span className="text-[#717182] text-sm ml-1">
                    {authorEmail || "@user"}
                  </span>
                </p>
                <p className="text-sm line-clamp-3">
                  {post.profiles?.bio || "자기소개가 없습니다."}
                </p>
              </div>
            </div>
            {currentUserId && currentUserId !== post.user_id && (
              <button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={`cursor-pointer leading-none rounded-lg py-1.5 px-2 text-sm transition-colors ${
                  isAuthorFollowing
                    ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
                    : "text-[#6758FF] bg-[#6758FF]/10 hover:bg-[#6758FF]/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isFollowLoading
                  ? "처리중..."
                  : isAuthorFollowing
                  ? "팔로잉"
                  : "+ 팔로우"}
              </button>
            )}
          </div>
        </div>

        <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />

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
