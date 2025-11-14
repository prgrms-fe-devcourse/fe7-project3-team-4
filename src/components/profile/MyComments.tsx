import { Heart, MessageCircle, MessageSquareReply } from "lucide-react";
import Link from "next/link";
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
  posts?: {
    post_type?: string;
    sub_type?: string;
  } | null;
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

  const getPostUrl = (comment: DbCommentRow) => {
    const postType = comment.posts?.post_type;
    const subType = comment.posts?.sub_type;
    
    // post_type에 따라 URL 생성
    if (subType) {
      return `/?type=${postType}&id=${comment.target_id}&sub_type=${subType}`;
    }
    
    return `/?type=${postType}&id=${comment.target_id}`;
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isLiked =
          comment.isLiked ??
          !!(comment.comment_likes && comment.comment_likes.length > 0);

        return (
          <ContentBox key={comment.id}>
            <Link 
              href={getPostUrl(comment)}
              className="block p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MessageCircle size={20} className="text-[#6758FF]" />
                <div className="space-y-3 flex-1">
                  <p className="text-sm text-gray-800">
                    {comment.content || "(내용 없음)"}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="text-[#717182] text-sm flex gap-5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onLikeToggle(comment.id);
                        }}
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
            </Link>
          </ContentBox>
        );
      })}
    </div>
  );
}