/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createClient } from "@/utils/supabase/client";
import { CircleArrowUp, Smile, X } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Database } from "@/utils/supabase/supabase";
import UserAvatar from "@/components/shop/UserAvatar";
// 🌟 1. UserAvatar 임포트

type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];

// 🌟 2. 프로필 타입에 뱃지 ID 추가
type UserProfile = {
  avatar_url: string | null;
  display_name: string | null;
  email: string | null;
  equipped_badge_id: string | null; // 👈 뱃지 ID 추가
};

// ✅ Props 인터페이스 명확화
interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onCancel?: () => void;
  placeholder?: string;
  onCommentAdded?: () => void; // 부모에게 알리기 위한 콜백
}

export default function CommentForm({
  postId,
  parentId = null,
  onCancel,
  placeholder = "댓글을 입력하세요...",
  onCommentAdded,
}: CommentFormProps) {
  const [commentText, setCommentText] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient(); // ✅ 컴포넌트 레벨에서 단 한 번만 생성

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // 🌟 3. profiles 테이블 조회 시 뱃지 ID 추가
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("avatar_url, display_name, email, equipped_badge_id") // 👈 뱃지 ID 조회
          .eq("id", user.id)
          .single();

        if (!error && profile) {
          setUserProfile(profile);
        }
      }
    };

    fetchUser();
  }, [supabase]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);

    const newComment: CommentInsert = {
      content: commentText,
      target_id: postId,
      user_id: user.id,
      parent_id: parentId,
    };

    // ✅ INSERT (불필요한 supabase 재생성 제거)
    const { error } = await supabase // data 제거
      .from("comments")
      .insert([newComment])
      .select();

    if (error) {
      console.error("Error inserting comment:", error);
      alert(`댓글 작성 실패: ${error.message || "알 수 없는 오류"}`);
    } else {
      setCommentText("");

      // // ✅ 댓글 수 증가 RPC 호출
      // await supabase.rpc("increment_post_comment_count", {
      //   post_id: postId,
      // });

      // ✅ 대댓글 로직
      if (parentId) {
        const { data: parentComment } = await supabase
          .from("comments")
          .select("reply_count")
          .eq("id", parentId)
          .single();

        if (parentComment) {
          await supabase
            .from("comments")
            .update({
              has_reply: true,
              reply_count: (parentComment.reply_count || 0) + 1,
            })
            .eq("id", parentId);
        }

        if (onCancel) onCancel();
      }

      // ✅ 부모 컴포넌트에 알림 (댓글 목록 새로고침)
      onCommentAdded?.();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex items-start gap-2 my-6">
      {/* 🌟 4. <img> 태그를 UserAvatar 컴포넌트로 교체 */}
      <UserAvatar
        src={userProfile?.avatar_url}
        alt={userProfile?.display_name || "User"}
        equippedBadgeId={userProfile?.equipped_badge_id}
        className="w-8 h-8 shrink-0" // 👈 크기 지정
      />

      <form
        className="flex-1 flex items-center justify-between px-3 py-2 bg-white border border-black/10 self-center rounded-lg gap-2 dark:bg-white/30"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder={user ? placeholder : "로그인이 필요합니다."}
          className="flex-1 outline-none text-sm"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={!user || isSubmitting}
        />
        <div className="flex items-center gap-2">
          {parentId && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="block cursor-pointer text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
          <button
            type="button"
            className="block cursor-pointer text-[#A6A6DB] hover:text-[#6758FF] disabled:text-gray-400"
            disabled={!user || isSubmitting}
          >
            <Smile size={20} />
          </button>
          <button
            type="submit"
            className="block cursor-pointer text-[#6758FF] disabled:text-gray-400 dark:disabled:text-gray-500"
            disabled={!user || !commentText.trim() || isSubmitting}
          >
            <CircleArrowUp size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
