import { Heart, MessageCircle, MessageSquareReply } from "lucide-react";
import ContentBox from "../ContentBox";

export default function MyComments() {
  return (
    <>
      <ContentBox>
        <div className="p-6 flex items-start gap-3">
          <MessageCircle size={20} className="text-[#6758FF]" />
          <div className="space-y-3">
            <p>
              <span>김서진</span>{" "}
              <span className="text-sm text-[#717182]">
                님의 [게시글의 제목]에 단 댓글
              </span>
            </p>
            <p className="ml-2">댓글 내용</p>
            <div className="text-[#717182] text-sm flex gap-5">
              <div className="flex items-center gap-2">
                <Heart size={18} />
                <span>23</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquareReply size={18} />
                <span>12</span>
              </div>
            </div>
          </div>
        </div>
      </ContentBox>
    </>
  );
}
