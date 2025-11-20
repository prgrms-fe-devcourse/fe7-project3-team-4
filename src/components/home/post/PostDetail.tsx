"use client";

import { ArrowLeft, ArrowUpDown, Edit, Trash } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Comments from "./Comments";
import { PostType } from "@/types/Post";
import Image from "next/image";
import CommentForm from "./CommentForm";
import PostActions from "./PostAction";
import { createClient } from "@/utils/supabase/client";
import PromptDetail from "./PromptDetail";
import Link from "next/link";
import { extractImageSrcArr } from "@/utils/extractTextFromJson";
import { useFollow } from "@/context/FollowContext";
import { getTranslatedTag } from "@/utils/tagTranslator";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/shop/UserAvatar";
import { Json } from "@/utils/supabase/supabase"; // 🌟 1. Json 타입 임포트
import { useToast } from "@/components/common/toast/ToastContext";
import ConfirmModal from "@/components/common/ConfirmModal";

// ... (RawComment, PostComment 타입 정의는 동일) ...
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
    equipped_badge_id?: string | null;
  } | null;
};

type PostComment = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  like_count: number;
  reply_count: number;
  has_reply: boolean;
  parent_id: string | null;
  user_id: string;
  profiles: {
    display_name: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    equipped_badge_id: string | null;
  };
};

// 🌟 2. Supabase 쿼리 반환 타입을 정확히 정의 (any 대신 사용)
type PostDetailQueryData = {
  id: string;
  title: string | null;
  content: Json;
  created_at: string | null;
  updated_at: string | null;
  post_type: string | null;
  hashtags: string[] | null;
  like_count: number | null;
  view_count: number | null;
  comment_count: number | null;
  user_id: string | null;
  model: string | null;
  result_mode: string | null;
  thumbnail: string | null;
  subtitle: string | null;
  profiles: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    equipped_badge_id: string | null;
  } | null;
  user_post_likes: { user_id: string }[];
  user_post_bookmarks: { user_id: string }[];
};

interface PostDetailProps {
  post: PostType;
  onBack: () => void;
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
}

export default function PostDetail({
  post: initialPost,
  onLikeToggle,
  onBookmarkToggle,
  onBack,
}: PostDetailProps) {
  const [post, setPost] = useState(initialPost);
  
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);
  
  const [comments, setComments] = useState<PostComment[]>([]);
  const [sortOrder, setSortOrder] = useState<"latest" | "popular">("latest");
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const { isFollowing, toggleFollow, currentUserId } = useFollow();

  const authorName = post.profiles?.display_name || "익명";
  const authorEmail = post.profiles?.email || "";
  const authorAvatar = post.profiles?.avatar_url || null;
  const authorUserId = post.user_id;
  const authorEquippedBadgeId = post.profiles?.equipped_badge_id || null;
  const { showToast } = useToast();
  const isAuthorFollowing = isFollowing(authorUserId);

  // 🌟 3. 게시글의 최신 정보를 가져오는 useEffect 수정
  useEffect(() => {
    const fetchLatestPostData = async () => {
      // 쿼리는 HomePageClient의 것과 거의 동일
      const { data: postData, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id (
            display_name,
            email,
            avatar_url,
            bio,
            equipped_badge_id
          ),
          user_post_likes!left(user_id),
          user_post_bookmarks!left(user_id)
        `
        )
        .eq("id", initialPost.id)
        .eq(
          "user_post_likes.user_id",
          currentUserId || "00000000-0000-0000-0000-000000000000"
        )
        .eq(
          "user_post_bookmarks.user_id",
          currentUserId || "00000000-0000-0000-0000-000000000000"
        )
        .single(); // 👈 단일 게시글이므로 .single() 사용

      if (error) {
        console.error("Error refetching post details:", error);
      } else if (postData) {
        // HomePageClient의 매핑 로직과 동일하게 변환

        // 🌟 4. 'as any' 대신 정확한 타입 단언 사용
        const typedData = postData as PostDetailQueryData;

        const postWithState: PostType = {
          id: typedData.id,
          title: typedData.title || "",
          content: typedData.content,
          created_at: typedData.created_at || "",
          post_type: typedData.post_type || "",
          hashtags: typedData.hashtags || undefined,
          like_count: typedData.like_count || 0,
          comment_count: typedData.comment_count || 0,
          view_count: typedData.view_count || 0,
          user_id: typedData.user_id || "",
          model: (typedData.model as "GPT" | "Gemini") || undefined,
          result_mode: (typedData.result_mode as "text" | "image") || undefined,
          thumbnail: typedData.thumbnail || "",
          subtitle: typedData.subtitle || "",
          isLiked: !!(
            typedData.user_post_likes && typedData.user_post_likes.length > 0
          ),
          isBookmarked: !!(
            typedData.user_post_bookmarks &&
            typedData.user_post_bookmarks.length > 0
          ),
          profiles: typedData.profiles
            ? {
                display_name: typedData.profiles.display_name,
                email: typedData.profiles.email,
                avatar_url: typedData.profiles.avatar_url,
                bio: typedData.profiles.bio, // bio 추가
                equipped_badge_id: typedData.profiles.equipped_badge_id,
              }
            : undefined,
        };
        // 🌟 4. state를 최신 정보로 업데이트
        setPost(postWithState);
      }
    };

    fetchLatestPostData();
  }, [initialPost.id, currentUserId, supabase]);

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

  useEffect(() => {
    const recordViewHistory = async () => {
      if (currentUserId) {
        const { error } = await supabase.from("user_post_views").upsert(
          {
            user_id: currentUserId,
            post_id: post.id,
            viewed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id, post_id",
          }
        );

        if (error) {
          console.error("조회 내역 기록 오류:", error.message);
        }
      }
    };

    recordViewHistory();
  }, [currentUserId, post.id, supabase]);

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
          bio,
          equipped_badge_id 
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
                equipped_badge_id: comment.profiles.equipped_badge_id ?? null,
              }
            : {
                display_name: "익명",
                email: "user",
                avatar_url: null,
                bio: null,
                equipped_badge_id: null,
              },
        })
      );
      setComments(formattedComments);
    }
  }, [post.id, sortOrder, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime 구독
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
          // 🌟 5. (옵션) 실시간 업데이트 시 post state도 갱신
          setPost((prev) => ({
            ...prev,
            comment_count: updatedPost.comment_count,
            like_count: updatedPost.like_count ?? prev.like_count,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(postChannel);
    };
  }, [post.id, supabase, fetchComments]);

  // ... (handleFollowToggle, handleCommentAdded, handleDeletePost 로직은 동일) ...
  const handleFollowToggle = async () => {
    if (!currentUserId || !authorUserId) {
      showToast({
        title: "팔로우 실패",
        message: "로그인 후 이용 가능합니다.",
        variant: "warning",
      });

      return;
    }
    if (currentUserId === authorUserId) {
      showToast({
        title: "팔로우 실패",
        message: "자기 자신을 팔로우 할 수 없습니다.",
        variant: "warning",
      });
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
        showToast({
          title: "팔로우 오류",
          message: "팔로우 처리 중 오류가 발생했습니다.",
          variant: "error",
        });
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleCommentAdded = () => {
    fetchComments();
  };

  /* 게시글 삭제시 댓글까지 모두 삭제 */
  const handleDeletePost = () => {
    if (!currentUserId) {
      showToast({
        title: "게시물 삭제 실패",
        message: "로그인 후 이용 가능합니다.",
        variant: "warning",
      });
      return;
    }

    if (currentUserId !== post.user_id) {
      showToast({
        title: "게시물 삭제 실패",
        message: "게시물 작성자만 삭제할 수 있습니다.",
        variant: "warning",
      });
      return;
    }

    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeletePost = async () => {
    if (!currentUserId) {
      showToast({
        title: "게시글 삭제 오류",
        message: "로그인 정보가 유효하지 않습니다.",
        variant: "error",
      });
      setIsDeleteConfirmOpen(false);
      return;
    }
    try {
      setIsDeleting(true);

      // 이 게시글에 달린 모든 댓글 삭제 (대댓글 포함)
      const { error: commentsError } = await supabase
        .from("comments")
        .delete()
        .eq("target_id", post.id);

      if (commentsError) {
        console.error("Error deleting comments:", commentsError);
        showToast({
          title: "댓글 삭제 오류",
          message: "댓글 삭제 중 오류가 발생했습니다.",
          variant: "error",
        });

        setIsDeleting(false);
        setIsDeleteConfirmOpen(false);
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
        showToast({
          title: "게시글 삭제 오류",
          message: "게시글 삭제 중 오류가 발생했습니다.",
          variant: "error",
        });
        setIsDeleting(false);
        setIsDeleteConfirmOpen(false);
        return;
      }

      showToast({
        title: "게시글 삭제 성공",
        message: "게시글 삭제되었습니다.",
        variant: "success",
      });
      setIsDeleteConfirmOpen(false);
      window.location.href = `/?type=${post.post_type}`;
    } catch (error) {
      console.error("Unexpected error while deleting post:", error);
      showToast({
        title: "게시글 삭제 오류",
        message: "게시글 삭제 중 오류가 발생했습니다.",
        variant: "error",
      });
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
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
          <div className="flex gap-2 px-2 items-center">
            {/* 수정 */}
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/write?mode=edit&postId=${post.id}&type=${post.post_type}`
                )
              }
              className="p-1 leading-none cursor-pointer flex justify-center items-center gap-2 text-[#6758FF] border border-[#6758FF] rounded-md hover:text-white hover:bg-[#776bff]"
            >
              <Edit size={18} />
            </button>
            {/* 삭제 */}
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="p-1 leading-none cursor-pointer flex justify-center items-center gap-2 text-[#ff4646] border border-[#ff4646] rounded-md hover:text-white hover:bg-[#ff4646]"
            >
              <Trash size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl dark:bg-white/20">
        <div className="pb-7">
          <div className="flex justify-between">
            <div className="flex gap-3 items-center">
              <Link
                href={`/profile?userId=${post.user_id}`}
                className="relative shrink-0 w-11 h-11 hover:opacity-80 transition-opacity"
              >
                <UserAvatar
                  src={authorAvatar}
                  alt={authorName}
                  equippedBadgeId={authorEquippedBadgeId}
                  className="w-full h-full"
                />
              </Link>
              <div className="flex-1 space-y-1 leading-none">
                <p>
                  {authorName}
                  <span className="text-[#717182] text-sm ml-1 dark:text-[#A6A6DB]">
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
              <p className="whitespace-pre-wrap">{post.subtitle}</p>
            </div>
          </div>

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 text-sm text-[#248AFF]">
              {post.hashtags.map((tag, i) => (
                <span key={i}>#{getTranslatedTag(tag)}</span>
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

      {(post.post_type === "prompt" || post.post_type === "weekly") && (
        <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl dark:bg-white/20">
          <PromptDetail post={post} />
        </div>
      )}

      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl dark:bg-white/20">
        <div>
          <p className="ml-2 mb-2 text-ms font-medium">작성자 소개</p>
          <div className="flex justify-between items-start gap-3 p-3 bg-white rounded-xl dark:bg-white/10">
            <div className="flex-1 flex gap-3">
              <Link
                href={`/profile?userId=${post.user_id}`}
                className="relative shrink-0 w-11 h-11 hover:opacity-80 transition-opacity"
              >
                <UserAvatar
                  src={authorAvatar}
                  alt={authorName}
                  equippedBadgeId={authorEquippedBadgeId}
                  className="w-full h-full"
                />
              </Link>
              <div className="flex-1 space-y-1 leading-none">
                <p>
                  {authorName}
                  <span className="text-[#717182] text-sm ml-2 dark:text-[#A6A6DB]">
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
          <div className="p-1 flex items-center gap-3 py-1 px-4 bg-white rounded-lg border border-[#F2F2F4] dark:bg-white/20 dark:border-[#F2F2F4]/40">
            <ArrowUpDown size={12} />
            <div className="text-sm space-x-1 p-0.5 bg-[#EEEEF0] rounded-lg dark:bg-[#EEEEF0]/40">
              <button
                onClick={() => setSortOrder("latest")}
                className={`cursor-pointer py-1 px-3 rounded-lg ${
                  sortOrder === "latest"
                    ? "bg-white shadow dark:text-[#0A0A0A] dark:bg-white/60"
                    : ""
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => setSortOrder("popular")}
                className={`cursor-pointer py-1 px-3 rounded-lg ${
                  sortOrder === "popular"
                    ? "bg-white shadow dark:text-[#0A0A0A] dark:bg-white/60"
                    : ""
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
      <ConfirmModal
        title="게시글 삭제 확인"
        description={
          "이 게시글과 이 게시글에 달린 모든 댓글이 삭제됩니다.\n정말 삭제하시겠어요?"
        }
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        open={isDeleteConfirmOpen}
      />
    </div>
  );
}
