// src/app/(home)/post/[id]/PostDetail.tsx
"use client";

import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Comments from "./Comments";
import RichTextRenderer from "@/components/common/RichTextRenderer";
import { PostType } from "@/types/Post";
import Image from "next/image";
import CommentForm from "./CommentForm";
import PostActions from "./PostAction";
import { createClient } from "@/utils/supabase/client";
import PromptDetail from "./PromptDetail";
import Link from "next/link"; // ⭐️ 추가

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
  
  const supabase = createClient();
  const authorName = post.profiles?.display_name || "익명";
  const authorEmail = post.profiles?.email || "";
  const authorAvatar = post.profiles?.avatar_url || null;
  // const displayDate = (post.created_at || "").slice(0, 10);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);

  useEffect(() => {
    const incrementViewCount = async () => {
      const { error } = await supabase.rpc('increment_view_count', {
        post_id: post.id
      });
      
      if (error) {
        console.error('Error incrementing view count:', error);
      }
    };

    incrementViewCount();
  }, [post.id, supabase]);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || !post.user_id) return;
      
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', post.user_id)
        .single();

      if (!error && data) {
        setIsFollowing(true);
      }
    };

    checkFollowStatus();
  }, [currentUserId, post.user_id, supabase]);

  const handleFollowToggle = async () => {
    if (!currentUserId || !post.user_id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (currentUserId === post.user_id) {
      alert('자기 자신을 팔로우할 수 없습니다.');
      return;
    }

    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', post.user_id);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: post.user_id
          });

        if (error) throw error;
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('팔로우 처리 중 오류가 발생했습니다.');
    } finally {
      setIsFollowLoading(false);
    }
  };

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
  }, [post.id, supabase, fetchComments]);

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
          const updatedPost = payload.new as {
            comment_count: number;
            like_count?: number;
          };
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
  }, [post.id, supabase]);

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
        {/* 작성자 정보 */}
        <div className="pb-7">
          <div className="flex justify-between">
            <div className="flex gap-3 items-center">
              {/* ⭐️ Link로 감싸서 클릭 시 프로필 이동 */}
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
              {/* ⭐️ 작성자 정보 텍스트도 Link로 감싸기 */}
              <Link 
                href={`/profile?userId=${post.user_id}`}
                className="flex-1 space-y-1 leading-none hover:underline"
              >
                <p>
                  {authorName}
                  <span className="text-[#717182] text-sm ml-1">
                    {authorEmail || "@user"}
                  </span>
                </p>
                <p className="text-sm line-clamp-2">
                  {post.profiles?.bio || "자기소개가 없습니다."}
                </p>
              </Link>
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
          <div className="mt-5">
            <div className="space-y-4">
              <p className="text-[18px] font-medium">{post.title}</p>
              <div className="mt-4">
                <RichTextRenderer content={post.content} showImage={true} />
              </div>
            </div>
          </div>
          {/* 태그 */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 text-sm text-[#248AFF]">
              {post.hashtags.map((tag, i) => (
                <span key={i}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
              ))}
            </div>
          )}
        </div>

        {/* 좋아요/북마크 */}
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

      {/* 프롬프트 세부 */}
      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
        <PromptDetail />
      </div>

      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
        {/* 작성자 소개 */}
        <div>
          <p className="ml-2 mb-2 text-ms font-medium">작성자 소개</p>
          <div className="flex justify-between items-start gap-3 p-3 bg-white rounded-lg">
            <div className="flex-1 flex gap-3">
              {/* ⭐️ 작성자 프로필 이미지 Link 추가 */}
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
                <p className="text-sm line-clamp-2">
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
                    ? 'text-gray-600 bg-gray-100 hover:bg-gray-200' 
                    : 'text-[#6758FF] bg-[#6758FF]/10 hover:bg-[#6758FF]/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isFollowLoading ? '처리중...' : isFollowing ? '팔로잉' : '+ 팔로우'}
              </button>
            )}
          </div>
        </div>

        {/* 댓글 작성 */}
        <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />

        {/* 댓글 목록 */}
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