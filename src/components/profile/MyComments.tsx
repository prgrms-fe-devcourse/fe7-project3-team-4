// src/components/profile/MyComments.tsx
import { Heart, MessageCircle, MessageSquareReply } from "lucide-react";
import ContentBox from "../ContentBox";
import EmptyActivity from "./EmptyActivity";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import { Database } from "@/utils/supabase/supabase";

// ⭐️ 좋아요 상태 추가
type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
  comment_likes?: { user_id: string }[] | null; // ⭐️ 추가
  isLiked?: boolean; // ⭐️ 클라이언트에서 계산된 상태
};

type MyCommentsProps = {
  comments: DbCommentRow[];
  onLikeToggle: (id: string) => void; // ⭐️ 추가
};

export default function MyComments({ 
  comments,
  onLikeToggle // ⭐️ 추가
}: MyCommentsProps) {
  if (!comments || comments.length === 0) {
    return <EmptyActivity message="작성한 댓글이 없습니다" />;
  }

  return (
    <>
      <div className="space-y-4">
        {comments.map((comment) => {
          // ⭐️ 좋아요 상태 계산
          const isLiked = comment.isLiked ?? !!(comment.comment_likes && comment.comment_likes.length > 0);
          
          return (
            <ContentBox key={comment.id}>
              <div className="p-6 flex items-start gap-3">
                <MessageCircle size={20} className="text-[#6758FF]" />
                <div className="space-y-3 flex-1">
                  {/* 댓글 내용 */}
                  <p className="text-sm text-gray-800">
                    {comment.content || "(내용 없음)"}
                  </p>

                  <div className="flex justify-between items-center">
                    {/* 좋아요/답글 수 */}
                    <div className="text-[#717182] text-sm flex gap-5">
                      {/* ⭐️ 좋아요 버튼 클릭 가능하도록 수정 */}
                      <button
                        onClick={() => onLikeToggle(comment.id)}
                        className="flex items-center gap-2 hover:text-red-500 transition-colors"
                      >
                        <Heart 
                          size={18}
                          className={isLiked ? "fill-red-500 text-red-500" : ""}
                        />
                        <span>{comment.like_count ?? 0}</span>
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <MessageSquareReply size={18} />
                        <span>{comment.reply_count ?? 0}</span>
                      </div>
                    </div>
                    
                    {/* 시간 */}
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(comment.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </ContentBox>
          );
        })}
      </div>
    </>
  );
}