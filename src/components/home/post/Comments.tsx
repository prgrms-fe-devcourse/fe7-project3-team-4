"use client";

import { CornerDownRight, ThumbsUp, Trash2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import CommentForm from "./CommentForm";
import Image from "next/image";

type RawReply = {
  id: string;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  like_count: number | null;
  user_id: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

export default function Comments({
  comment,
  postId,
  onCommentDeleted,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, [supabase.auth]);

  // ✅ 대댓글 조회
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
      const formattedReplies: Reply[] = (data as RawReply[]).map((reply) => ({
        id: reply.id,
        content: reply.content ?? "",
        created_at: reply.created_at,
        updated_at: reply.updated_at,
        like_count: reply.like_count ?? 0,
        display_name: reply.profiles?.display_name ?? "익명",
        email: reply.profiles?.email ?? "user",
        avatar_url: reply.profiles?.avatar_url ?? null,
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

  // 댓글 수정
  const handleEdit = async () => {
    if (!editContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const { error } = await supabase
      .from("comments")
      .update({
        content: editContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", comment.id);

    if (error) {
      console.error("Error updating comment:", error);
      alert("댓글 수정에 실패했습니다.");
    } else {
      setIsEditing(false);
      if (onCommentDeleted) {
        onCommentDeleted();
      }
    }
  };

  // 대댓글 수정
  const handleReplyEdit = async (replyId: string) => {
    if (!editReplyContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const { error } = await supabase
      .from("comments")
      .update({
        content: editReplyContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", replyId);

    if (error) {
      console.error("Error updating reply:", error);
      alert("답글 수정에 실패했습니다.");
    } else {
      setEditingReplyId(null);
      setEditReplyContent("");
      fetchReplies();
    }
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
          const newReplyCount = Math.max(
            (parentComment.reply_count || 0) - 1,
            0
          );
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

  const handleLikeToggle = async (commentId: string) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // 1️⃣ 사용자가 이미 좋아요했는지 확인
      const { data: existingLike, error: fetchError } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("comment_id", commentId)
        .maybeSingle(); // .single() 대신 .maybeSingle()로 안전하게

      if (fetchError) throw fetchError;

      // 2️⃣ 좋아요 취소
      if (existingLike) {
        const { error: deleteError } = await supabase
          .from("comment_likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) throw deleteError;
      }
      // 3️⃣ 좋아요 추가
      else {
        const { error: insertError } = await supabase
          .from("comment_likes")
          .insert({
            user_id: user.id,
            comment_id: commentId,
          });

        if (insertError) throw insertError;
      }

      // 4️⃣ 댓글 목록 새로고침 (대댓글이면 fetchReplies 호출)
      if (showReplies) {
        fetchReplies();
      } else {
        // 필요 시 상위 comments 리스트 새로고침 함수 호출
        // fetchComments();
      }
    } catch (err) {
      console.error("Error toggling like:", err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              {comment.profiles?.avatar_url ? (
                <Image
                  src={comment.profiles?.avatar_url}
                  alt={comment.profiles?.display_name || ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex items-center justify-center h-full w-full text-gray-500 text-sm font-semibold">
                  {comment.profiles?.display_name || "?"}
                </span>
              )}
            </div>
            {/* 이름 + 이메일 */}
            <div className="mb-1.5">
              <div className="text-sm font-medium">
                {comment.profiles?.display_name}
              </div>
              <div className="text-xs text-[#717182] dark:text-[#A6A6DB]">
                @{comment.profiles?.email}
              </div>
            </div>
          </div>
          {/* 수정/삭제 버튼 */}
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="cursor-pointer text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-500"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(comment.id)}
                disabled={isDeleting}
                className="cursor-pointer text-red-500 hover:text-red-700 disabled:text-gray-400 dark:text-red-300 dark:hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        {/* 댓글 내용 */}
        <div className="ml-11">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 bg-[#EBF2FF] text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-gray-500 dark:bg-[#EBF2FF]/30"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="cursor-pointer px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="cursor-pointer px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="inline-block px-3 py-2 bg-[#EBF2FF] text-sm rounded-xl dark:bg-[#EBF2FF]/30">
                {comment.content}
              </span>
              {/* 댓글 메뉴 버튼 */}
              <div className="ml-1 text-[#717182] dark:text-white flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => handleLikeToggle(comment.id)}
                  className="cursor-pointer flex items-center justify-center w-5 h-5 rounded-full bg-white border border-[#F0F0F0] hover:bg-gray-200 dark:bg-white/20 dark:border-[#F0F0F0]/40 dark:hover:bg-gray-300  dark:hover:text-[#6758FF]"
                >
                  <ThumbsUp size={10} />
                </button>
                <span className="text-xs dark:text-white">
                  {comment.like_count || 0}
                </span>
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="cursor-pointer flex items-center justify-center w-5 h-5 rounded-full bg-white border border-[#F0F0F0] hover:bg-gray-200 ml-1 dark:bg-white/20 dark:border-[#F0F0F0]/40 dark:hover:bg-gray-300  dark:hover:text-[#6758FF]"
                >
                  <CornerDownRight size={10} />
                </button>
                <span className="ml-1 text-xs dark:text-white">
                  {comment.created_at.slice(0, 10)}
                </span>
              </div>
            </>
          )}

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
                className="block cursor-pointer text-[#0094FF] text-sm mt-2 hover:text-[#0095ff8f] dark:text-[#70c3ff8f] dark:hover:text-[#70c3ff]"
              >
                {showReplies
                  ? "답글 숨기기"
                  : `${comment.reply_count}개의 답글 보기`}
              </button>

              {/* 대댓글 목록 */}
              {showReplies && (
                <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-200">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="flex justify-between items-start gap-2"
                    >
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
                          {editingReplyId === reply.id ? (
                            <div className="space-y-2 mt-1">
                              <textarea
                                value={editReplyContent}
                                onChange={(e) =>
                                  setEditReplyContent(e.target.value)
                                }
                                className="w-full px-2 py-1 bg-[#F5F5F5] text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReplyEdit(reply.id)}
                                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingReplyId(null);
                                    setEditReplyContent("");
                                  }}
                                  className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="inline-block px-2 py-1 bg-[#F5F5F5] text-xs rounded-lg mt-1">
                                {reply.content}
                              </span>
                              <div className="flex items-center gap-1 mt-1 text-[#717182]">
                                <button
                                  onClick={() => handleLikeToggle(reply.id)}
                                  className="cursor-pointer flex items-center justify-center w-4 h-4 rounded-full bg-white border border-[#F0F0F0] hover:bg-gray-100"
                                >
                                  <ThumbsUp size={8} />
                                </button>
                                <span className="text-xs">
                                  {reply.like_count || 0}
                                </span>
                                <span className="ml-1 text-xs">
                                  {reply.created_at.slice(0, 10)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {/* 대댓글 수정/삭제 버튼 */}
                      {user?.id === reply.user_id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingReplyId(reply.id);
                              setEditReplyContent(reply.content);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(reply.id, true)}
                            disabled={isDeleting}
                            className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
