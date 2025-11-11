"use client";

import { createClient } from "@/utils/supabase/client";
import { CircleArrowUp, Smile } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Database } from "@/utils/supabase/supabase";

type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];

export default function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    const supabase = createClient();

    const newComment: CommentInsert = {
      content: commentText,
      target_id: postId,
      user_id: user.id,
      parent_id: null, // 대댓글이 아닌, 1레벨 댓글이므로 null로 설정
      // target_type 나중에 추가
    };

    const { error } = await supabase.from("comments").insert(newComment);

    if (error) {
      console.error("Error inserting comment:", error);
    } else {
      setCommentText("");
      router.refresh(); // 서버 컴포넌트 데이터를 새로고침
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center gap-2 my-6">
      <div className="w-8 h-8 bg-gray-300 rounded-full">
        {/* 프로필 이미지 표시 로직 (예: user?.user_metadata?.avatar_url) */}
      </div>

      <form
        className="flex-1 flex items-center justify-between px-3 py-2 bg-white border-black/10 self-center rounded-lg gap-2"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder={user ? "댓글을 입력하세요..." : "로그인이 필요합니다."}
          className="flex-1 outline-none"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={!user || isSubmitting}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="block cursor-pointer text-[#ADA4FF] disabled:text-gray-400"
            disabled={!user || isSubmitting}
          >
            <Smile />
          </button>
          <button
            type="submit"
            className="block cursor-pointer disabled:text-gray-400"
            disabled={!user || !commentText.trim() || isSubmitting}
          >
            <CircleArrowUp />
          </button>
        </div>
      </form>
    </div>
  );
}
