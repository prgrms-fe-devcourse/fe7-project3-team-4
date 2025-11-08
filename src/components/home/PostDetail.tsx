import {
  ArrowLeft,
  ArrowUpDown,
  Bookmark,
  CircleArrowUp,
  Heart,
  MessageSquare,
  Smile,
} from "lucide-react";
import Image from "next/image";
import Comments from "./Comments";

export const MOCK_COMMENTS: PostComment[] = [
  {
    id: 1,
    nickname: "prompt_holic",
    email: "prompt_holic@algo.dev",
    content: "이 프롬프트 써보고 답변 퀄리티 확실히 올라갔어요. 감사합니다 🙌",
    createdAt: "2025-10-29T12:15:00+09:00",
    hasReply: true,
  },
  {
    id: 2,
    nickname: "frontend_june",
    email: "june@algo.dev",
    content:
      "Next.js 예시까지 있어서 바로 프로젝트에 적용했습니다. 이런 글 더 많이 보고 싶어요.",
    createdAt: "2025-10-29T13:40:00+09:00",
  },
  {
    id: 3,
    nickname: "ai_learner",
    email: "ai_learner@algo.dev",
    content:
      "초보자 기준에서 어떤 부분을 먼저 이해하면 좋을지 간단히 정리해주시면 더 좋을 것 같아요!",
    createdAt: "2025-10-30T09:20:00+09:00",
  },
  {
    id: 4,
    nickname: "design_log",
    email: "design@algo.dev",
    content:
      "UI 사례가 너무 좋아요. 이미지 프롬프트랑 같이 쓰니까 와이어프레임 뽑는 속도가 미쳤네요.",
    createdAt: "2025-10-30T10:05:00+09:00",
    hasReply: true,
  },
  {
    id: 5,
    nickname: "devcat",
    email: "devcat@algo.dev",
    content:
      "GPT / Gemini 둘 다 비교해준 부분 유용했습니다. 팀 내 가이드 문서에 공유했어요 😺",
    createdAt: "2025-10-31T18:32:00+09:00",
  },
];

export default function PostDetail({
  post,
  onBack,
}: {
  post: Post;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6 pb-6">
      <button
        onClick={onBack}
        className="leading-none group cursor-pointer flex items-center gap-2 text-[#6758FF] hover:underline"
      >
        <ArrowLeft className="arrow-wiggle" />
        뒤로
      </button>

      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
        {/* 게시글 정보 */}
        <div className="pb-7">
          {/* 작성자 정보 */}
          <div className="flex justify-between">
            <div className="flex gap-3 items-center">
              {/* 프로필 이미지 */}
              <div className="w-11 h-11 bg-gray-300 rounded-full"></div>
              {/* 이름, 이메일, 작성 시간?날짜? */}
              <div className="space-y-1 leading-none">
                <p>{post.author}</p>
                <p className="text-[#717182] text-sm">
                  {post.email} · {post.createdAt.slice(0, 10)}
                </p>
              </div>
            </div>
            {post.model && (
              <div
                className={`h-[22px] text-xs font-semibold text-white px-3 py-1 ${
                  post.model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
                } rounded-full`}
              >
                {post.model}
              </div>
            )}
          </div>
          {/* 게시글 내용 */}
          <div className="my-5">
            {/* 제목 */}
            <div className="mb-6 space-y-4">
              <div className="text-[18px]">{post.title}</div>
            </div>
            {/* 썸네일(이미지) */}
            {post.image && (
              <Image
                src={post.image}
                alt={post.title}
                width={800}
                height={800}
                className="object-cover w-full h-auto bg-gray-300 rounded-lg"
              ></Image>
            )}
          </div>
          {/* 태그들 */}
          <div className="space-x-2 text-sm text-[#248AFF]">
            {post.hashtags.map((tag, i) => (
              <span key={i}>{tag}</span>
            ))}
          </div>
        </div>
        {/* 아래 버튼들 */}
        <div className="flex justify-center gap-30 text-[#717182]">
          <button className="cursor-pointer py-1 px-2 rounded-md hover:text-[#FF569B] hover:bg-[#F7E6ED]">
            <div className="flex gap-2 text-sm items-center ">
              <Heart size={18} />
              <span>{post.likes}</span>
            </div>
          </button>
          <button className="cursor-pointer py-1 px-2 rounded-md hover:bg-gray-200">
            <div className="flex gap-2 text-sm items-center">
              <MessageSquare size={18} />
              <span>{post.comments}</span>
            </div>
          </button>
          <button
            className={`cursor-pointer py-1 px-2 rounded-md hover:text-[#6758FF] hover:bg-[#D8D4FF] ${
              post.isBookmarked ? "text-[#6758FF] bg-[#D8D4FF]" : ""
            }`}
          >
            <Bookmark size={18} />
          </button>
        </div>
        {/* 작성자 소개 */}
        <div className="mt-7">
          <p className="ml-2 mb-2 text-ms font-medium">작성자 소개</p>
          <div className="flex justify-between items-start gap-3 p-3 bg-white rounded-lg">
            <div className="flex-1 flex gap-3">
              {/* 프로필 이미지 */}
              <div className="w-11 h-11 bg-gray-300 rounded-full"></div>
              {/* 이름, 이메일, 작성 시간?날짜? */}
              <div className="flex-1 space-y-1 leading-none">
                <p>
                  {post.author}
                  <span className="text-[#717182] text-sm ml-1">
                    {post.email}
                  </span>
                </p>
                <p className="text-sm line-clamp-2">
                  자기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개자기소개
                </p>
              </div>
            </div>
            <button className="cursor-pointer leading-none text-[#4888FF] bg-[#EBF2FF] rounded-lg py-1.5 px-2 text-sm">
              + 팔로우
            </button>
          </div>
        </div>
        {/* 댓글 입력 창 */}
        <div className="flex items-center gap-2 my-6">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <form className="flex-1 flex items-center justify-between px-3 py-2 bg-white border-black/10 self-center rounded-lg gap-2">
            <input
              type="text"
              placeholder="댓글을 입력하세요..."
              className="flex-1 outline-none"
            />
            <div className="flex items-center gap-2">
              <button className="block cursor-pointer text-[#ADA4FF]">
                <Smile />
              </button>
              <button type="submit" className="block cursor-pointer">
                <CircleArrowUp />
              </button>
            </div>
          </form>
        </div>
        {/* 댓글 영역 */}
        <div className="space-y-5">
          {/* 최신순 인기순 버튼 */}
          <div className="p-1 flex items-center gap-3 py-1 px-4 bg-white rounded-lg border border-[#F2F2F4]">
            <ArrowUpDown size={12} />
            <div className="text-sm space-x-1 p-0.5 bg-[#EEEEF0] rounded-lg">
              <button className="cursor-pointer py-1 px-3 rounded-lg bg-white shadow">
                최신순
              </button>
              <button className="cursor-pointer py-1 px-3 rounded-lg">
                인기순
              </button>
            </div>
          </div>
          {/* 댓글 영역 */}
          <div className="px-9">
            {/* 댓글 */}
            {MOCK_COMMENTS.map((comment) => (
              <Comments key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
