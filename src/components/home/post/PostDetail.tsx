"use client";

import { ArrowLeft, ArrowUpDown, Edit, Trash } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react"; // ⭐️ useRef 추가
import Comments from "./Comments";
import RichTextRenderer from "@/components/common/RichTextRenderer";
import { PostType } from "@/types/Post";
import Image from "next/image";
import CommentForm from "./CommentForm";
import PostActions from "./PostAction";
import { createClient } from "@/utils/supabase/client";
import PromptDetail from "./PromptDetail";
import Link from "next/link";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  extractImageSrcArr,
  pickNthParagraphDoc,
} from "@/utils/extractTextFromJson";
import { useRouter } from "next/navigation";

const FOLLOWS_CHANNEL = "follows-update-channel";

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // ⭐️ broadcast 채널을 useRef로 관리
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);

  const authorName = post.profiles?.display_name || "익명";
  const authorEmail = post.profiles?.email || "";
  const authorAvatar = post.profiles?.avatar_url || null;
  const authorUserId = post.user_id;

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);

  // 조회수 증가
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

  // 팔로우 상태 확인
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || !authorUserId) return;

      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", authorUserId)
        .single();

      if (!error && data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [currentUserId, authorUserId, supabase]);

  // 댓글 목록 가져오기
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

  // ⭐️ Realtime 구독 (수정됨)
  useEffect(() => {
    // 댓글 변경 감지
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

    // 게시글 업데이트 감지
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

    // ⭐️ 팔로우 Broadcast 구독 (항상 구독, 메시지는 필터링)
    const followBroadcastChannel = supabase.channel(FOLLOWS_CHANNEL, {
      config: { broadcast: { ack: true } },
    });

    // ✅ 해결: 채널 생성 직후 ref에 즉시 할당합니다.
    broadcastChannelRef.current = followBroadcastChannel;
    console.log(
      "[PostDetail] 🔵 Channel instance created and assigned to ref."
    );

    followBroadcastChannel
      .on("broadcast", { event: "follow-update" }, (payload) => {
        console.log("[PostDetail] 📥 Broadcast received:", payload);
        const { targetUserId, isFollowing: newIsFollowing } =
          payload.payload as {
            targetUserId: string;
            isFollowing: boolean;
          };

        if (targetUserId === authorUserId) {
          setIsFollowing(newIsFollowing);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[PostDetail] ✅ Subscribed to Broadcast");
          // ❗️ Ref 할당 로직이 여기서 제거되었습니다.
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            `[PostDetail] ❌ Broadcast subscription failed: ${status}`
          );
        }
      });

    // Cleanup
    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(postChannel);
      supabase.removeChannel(followBroadcastChannel);
      broadcastChannelRef.current = null;
    };
  }, [post.id, supabase, fetchComments, authorUserId]);

  // ⭐️ 팔로우 토글 핸들러 (수정됨)
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
    const newIsFollowing = !isFollowing;

    // 1. 낙관적 UI 업데이트
    setIsFollowing(newIsFollowing);

    try {
      // 2. DB 작업
      if (newIsFollowing) {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: authorUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", authorUserId);
        if (error) throw error;
      }

      // 3. ⭐️ ref에 저장된 채널로 broadcast 발송
      if (broadcastChannelRef.current) {
        await broadcastChannelRef.current.send({
          type: "broadcast",
          event: "follow-update",
          payload: { targetUserId: authorUserId, isFollowing: newIsFollowing },
        });
        console.log("[PostDetail] 📤 Broadcast sent:", {
          targetUserId: authorUserId,
          isFollowing: newIsFollowing,
        });
      } else {
        console.warn("[PostDetail] ⚠️ Broadcast channel not ready");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("팔로우 처리 중 오류가 발생했습니다.");
      // 4. 롤백
      setIsFollowing(!newIsFollowing);
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
              {/* 이미지 */}
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
              {/* content */}
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

      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
        <PromptDetail post={post} />
      </div>

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
                  isFollowing
                    ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
                    : "text-[#6758FF] bg-[#6758FF]/10 hover:bg-[#6758FF]/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isFollowLoading
                  ? "처리중..."
                  : isFollowing
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
