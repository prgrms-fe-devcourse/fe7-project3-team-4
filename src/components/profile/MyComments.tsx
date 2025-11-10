import { Heart, MessageCircle, MessageSquareReply } from "lucide-react";
import ContentBox from "../ContentBox";
import { Database } from "@/types"; // [⭐️ 1. Database 타입 임포트]
import EmptyActivity from "./EmptyActivity"; // [⭐️ 1. EmptyActivity 임포트]
import { formatTimeAgo } from "@/utils/formatTimeAgo"; // [⭐️ 1. formatTimeAgo 임포트]

// [⭐️ 2. DbCommentRow 타입 정의 (DataLoader와 동일)]
type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
};

type MyCommentsProps = {
  comments: DbCommentRow[];
};

export default function MyComments({ comments }: MyCommentsProps) { // [⭐️ 3. prop 받기]
  // [⭐️ 4. 데이터가 없을 경우 EmptyActivity 렌더링]
  if (!comments || comments.length === 0) {
    return <EmptyActivity message="작성한 댓글이 없습니다" />;
  }

  return (
    <>
      {/* [⭐️ 5. 댓글 목록을 map으로 순회] */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <ContentBox key={comment.id}>
            <div className="p-6 flex items-start gap-3">
              <MessageCircle size={20} className="text-[#6758FF]" />
              <div className="space-y-3 flex-1">
                {/* [참고] 
                  "내가" 작성한 댓글 목록이므로 "작성자" 표시는 생략합니다.
                  또한, 원본 게시글(target_id)의 제목을 가져오려면 
                  DataLoader에서 복잡한 동적 JOIN 또는 RPC가 필요하므로,
                  여기서는 댓글 내용과 시간만 표시하도록 간소화합니다.
                */}
                
                {/* 댓글 내용 */}
                <p className="text-sm text-gray-800">{comment.content || "(내용 없음)"}</p>
                
                <div className="flex justify-between items-center">
                  {/* 좋아요/답글 수 */}
                  <div className="text-[#717182] text-sm flex gap-5">
                    <div className="flex items-center gap-2">
                      <Heart size={18} />
                      {/* [⭐️ 5.1] 동적 데이터 (스키마에 추가한 필드) */}
                      <span>{comment.like_count ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquareReply size={18} />
                      {/* [⭐️ 5.2] 동적 데이터 (스키마에 추가한 필드) */}
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
        ))}
      </div>
    </>
  );
}