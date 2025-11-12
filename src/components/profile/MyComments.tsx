import { Heart, MessageCircle, MessageSquareReply } from "lucide-react";
import ContentBox from "../ContentBox";
import EmptyActivity from "./EmptyActivity";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import { Database } from "@/utils/supabase/supabase";

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
  comment_likes?: { user_id: string }[] | null;
  isLiked?: boolean;
};

type MyCommentsProps = {
  comments: DbCommentRow[];
  onLikeToggle: (id: string) => void;
};

export default function MyComments({
  comments,
  onLikeToggle,
}: MyCommentsProps) {
  if (!comments || comments.length === 0) {
    return <EmptyActivity message="작성한 댓글이 없습니다" />;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isLiked =
          comment.isLiked ??
          !!(comment.comment_likes && comment.comment_likes.length > 0);

        return (
          <ContentBox key={comment.id}>
            <div className="p-6 flex items-start gap-3">
              <MessageCircle size={20} className="text-[#6758FF]" />
              <div className="space-y-3 flex-1">
                <p className="text-sm text-gray-800">
                  {comment.content || "(내용 없음)"}
                </p>

                <div className="flex justify-between items-center">
                  <div className="text-[#717182] text-sm flex gap-5">
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
  );
}
