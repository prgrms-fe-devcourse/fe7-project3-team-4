"use client";

import { CornerDownRight, ThumbsUp, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import CommentForm from "./CommentForm";
import Image from "next/image";
import { PostComment } from "./PostDetail";

type Reply = {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  display_name: string;
  email: string;
  avatar_url?: string;
  user_id: string;
};

export default function Comments({ 
  comment,
  postId,
  onCommentDeleted
}: { 
  comment: PostComment;
  postId: string;
  onCommentDeleted?: () => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  // 대댓글 조회
  const fetchReplies = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        like_count,
        user_id,
        profiles:user_id (
          display_name,
          email,
          avatar_url
        )
      `
      )
      .eq("parent_id", comment.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      return;
    }

    if (data) {
      const formattedReplies: Reply[] = data.map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        created_at: reply.created_at,
        updated_at: reply.updated_at,
        like_count: reply.like_count || 0,
        display_name: reply.profiles?.display_name || "익명",
        email: reply.profiles?.email || "user",
        avatar_url: reply.profiles?.avatar_url,
        user_id: reply.user_id,
      }));
      setReplies(formattedReplies);
    }
  };

  // 대댓글 보기 클릭
  const handleShowReplies = () => {
    if (!showReplies) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  // 댓글 삭제
  const handleDelete = async (commentId: string, isReply: boolean = false) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      alert("댓글 삭제에 실패했습니다.");
    } else {
      if (isReply) {
        // 대댓글 삭제 시 부모 댓글의 reply_count 감소
        const { data: parentComment } = await supabase
          .from("comments")
          .select("reply_count")
          .eq("id", comment.id)
          .single();

        if (parentComment) {
          const newReplyCount = Math.max((parentComment.reply_count || 0) - 1, 0);
          await supabase
            .from("comments")
            .update({
              reply_count: newReplyCount,
              has_reply: newReplyCount > 0,
            })
            .eq("id", comment.id);
        }
        
        fetchReplies();
      } else {
        // 부모 댓글 삭제 시 전체 목록 새로고침
        if (onCommentDeleted) {
          onCommentDeleted();
        }
      }
    }
    setIsDeleting(false);
  };

  // 좋아요 기능
  const handleLike = async (commentId: string, currentLikeCount: number) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const { error } = await supabase
      .from("comments")
      .update({ like_count: currentLikeCount + 1 })
      .eq("id", commentId);

    if (error) {
      console.error("Error updating like count:", error);
    } else {
      // 대댓글 좋아요인 경우 목록 새로고침
      if (showReplies) {
        fetchReplies();
      }
    }
  };

  // Realtime 구독 (대댓글)
  useEffect(() => {
    if (showReplies) {
      const channel = supabase
        .channel(`replies:${comment.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comments",
            filter: `parent_id=eq.${comment.id}`,
          },
          () => {
            fetchReplies();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [comment.id, showReplies]);

  const isOwner = user?.id === comment.user_id;

  return (
    <>
      <div className="mb-5">
        {/* 댓글 작성자 */}
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex gap-2">
            {/* 프로필 이미지 */}
            <div className="relative w-9 h-9 rounded-full bg-gray-300 shrink-0 overflow-hidden">
              {comment.avatar_url ? (
                <Image
                  src={comment.avatar_url}
                  alt={comment.display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex items-center justify-center h-full w-full text-gray-500 text-sm font-semibold">
                  {comment.display_name[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            {/* 이름 + 이메일 */}
            <div className="mb-1.5">
              <div className="text-sm font-medium">{comment.display_name}</div>
              <div className="text-xs text-[#717182]">@{comment.email}</div>
            </div>
          </div>
          {/* 삭제 버튼 */}
          {isOwner && (
            <button
              onClick={() => handleDelete(comment.id)}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 disabled:text-gray-400"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {/* 댓글 내용 */}
        <div className="ml-11">
          <span className="inline-block px-3 py-2 bg-[#EBF2FF] text-sm rounded-[10px]">
            {comment.content}
          </span>
          {/* 댓글 메뉴 버튼 */}
          <div className="ml-1 text-[#717182] flex items-center gap-1 mt-2">
            <button
              onClick={() => handleLike(comment.id, comment.like_count)}
              className="cursor-pointer flex items-center justify-center w-5 h-5 rounded-full bg-white border border-[#F0F0F0] hover:bg-gray-100"
            >
              <ThumbsUp size={10} />
            </button>
            <span className="text-xs">{comment.like_count || 0}</span>
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="cursor-pointer flex items-center justify-center w-5 h-5 rounded-full bg-white border border-[#F0F0F0] hover:bg-gray-100 ml-1"
            >
              <CornerDownRight size={10} />
            </button>
            <span className="ml-1 text-xs">
              {comment.created_at.slice(0, 10)}
            </span>
          </div>
          
          {/* 대댓글 입력 폼 */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCancel={() => setShowReplyForm(false)}
                placeholder="답글을 입력하세요..."
              />
            </div>
          )}

          {/* 대댓글이 있으면 block */}
          {comment.has_reply && (
            <>
              <button
                onClick={handleShowReplies}
                className="block cursor-pointer text-[#0094FF] text-sm mt-2 hover:text-[#0095ff8f]"
              >
                {showReplies
                  ? "답글 숨기기"
                  : `${comment.reply_count}개의 답글 보기`}
              </button>

              {/* 대댓글 목록 */}
              {showReplies && (
                <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-200">
                  {replies.map((reply) => (
                    <div key={reply.id} className="flex justify-between items-start gap-2">
                      <div className="flex gap-2 flex-1">
                        {/* 프로필 이미지 */}
                        <div className="relative w-8 h-8 rounded-full bg-gray-300 shrink-0 overflow-hidden">
                          {reply.avatar_url ? (
                            <Image
                              src={reply.avatar_url}
                              alt={reply.display_name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center h-full w-full text-gray-500 text-xs font-semibold">
                              {reply.display_name[0]?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium">
                            {reply.display_name}
                            <span className="text-[#717182] font-normal ml-1">
                              @{reply.email}
                            </span>
                          </div>
                          <span className="inline-block px-2 py-1 bg-[#F5F5F5] text-xs rounded-lg mt-1">
                            {reply.content}
                          </span>
                          <div className="flex items-center gap-1 mt-1 text-[#717182]">
                            <button
                              onClick={() => handleLike(reply.id, reply.like_count)}
                              className="cursor-pointer flex items-center justify-center w-4 h-4 rounded-full bg-white border border-[#F0F0F0] hover:bg-gray-100"
                            >
                              <ThumbsUp size={8} />
                            </button>
                            <span className="text-xs">{reply.like_count || 0}</span>
                            <span className="ml-1 text-xs">
                              {reply.created_at.slice(0, 10)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* 대댓글 삭제 버튼 */}
                      {user?.id === reply.user_id && (
                        <button
                          onClick={() => handleDelete(reply.id, true)}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}