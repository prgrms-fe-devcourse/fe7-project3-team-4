import { CornerDownRight, ThumbsUp } from "lucide-react";

export default function Comments({ comment }: { comment: PostComment }) {
  return (
    <>
      <div className="mb-5">
        {/* 댓글 작성자 */}
        <div className="flex gap-2 mb-1">
          {/* 프로필 이미지 */}
          <div className="w-9 h-9 rounded-full bg-gray-300"></div>
          {/* 이름 + 이메일 */}
          <div className="mb-1.5">
            <div className="text-sm">{comment.display_name}</div>
            <div className="text-xs text-[#717182]">@{comment.email}</div>
          </div>
        </div>
        {/* 댓글 내용 */}
        <div className="ml-7">
          <span className="px-3 py-2 bg-[#EBF2FF] text-sm rounded-[10px]">
            {comment.content}
          </span>
          {/* 댓글 메뉴 버튼 */}
          <div className="ml-1 text-[#717182] flex items-center gap-1 mt-2">
            <button className="cursor-pointer flex items-center justify-center w-5 h-5 rounded-full bg-white border border-[#F0F0F0]">
              <ThumbsUp size={10} />
            </button>
            <button className="cursor-pointer flex items-center justify-center w-5 h-5 rounded-full bg-white border border-[#F0F0F0]">
              <CornerDownRight size={10} />
            </button>
            <span className="ml-1 text-xs">
              {comment.created_at.slice(0, 10)}
            </span>
          </div>
          {/* 대댓글이 있으면 block */}
          {comment.has_reply && (
            <>
              <button className="block cursor-pointer text-[#0094FF] text-sm mt-1 hover:text-[#0095ff8f]">
                1개의 답글 보기
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
