import {
  ArrowLeft,
  ArrowUpDown,
  Bookmark,
  Heart,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import Comments from "./Comments";
import CommentForm from "./CommentForm";

export const MOCK_COMMENTS: PostComment[] = [
  {
    id: "comment_1",
    content: "정말 유용한 프롬프트네요! 바로 적용해봤습니다.",
    created_at: "2025-11-01T10:05:00Z",
    parent_id: null,
    updated_at: "2025-11-01T10:05:00Z",
    display_name: "React초보",
    email: "react_newbie@example.com",
    has_reply: true,
  },
  {
    id: "comment_2",
    content: "혹시 state 대신 useReducer를 사용하는 예시도 보여주실 수 있나요?",
    created_at: "2025-11-01T10:10:00Z",
    parent_id: "comment_1",
    updated_at: "2025-11-01T10:10:00Z",
    display_name: "개발고수",
    email: "dev_master@example.com",
    has_reply: false,
  },
  {
    id: "comment_3",
    content: "좋은 질문입니다. 복잡한 상태 로직에는 useReducer가 더 적합하죠.",
    created_at: "2025-11-01T10:15:00Z",
    parent_id: "comment_2",
    updated_at: "2025-11-01T10:15:00Z",
    display_name: "React초보",
    email: "react_newbie@example.com",
    has_reply: false,
  },
  {
    id: "comment_4",
    content: "감사합니다!",
    created_at: "2025-11-02T15:00:00Z",
    parent_id: null,
    updated_at: "2025-11-02T15:00:00Z",
    display_name: "Next팬",
    email: "next_fan@example.com",
    has_reply: false,
  },
  {
    id: "comment_5",
    content:
      "피보나치 DP 풀이 방식 공유합니다. \n```javascript\nfunction fib(n) {\n  const dp = [0, 1];\n  for (let i = 2; i <= n; i++) {\n    dp[i] = dp[i - 1] + dp[i - 2];\n  }\n  return dp[n];\n}\n```",
    created_at: "2025-11-03T11:00:00Z",
    parent_id: null,
    updated_at: "2025-11-03T11:00:00Z",
    display_name: "알고리즘왕",
    email: "algo_king@example.com",
    has_reply: true,
  },
  {
    id: "comment_6",
    content: "와, 재귀보다 훨씬 빠르네요!",
    created_at: "2025-11-03T11:05:00Z",
    parent_id: "comment_5",
    updated_at: "2025-11-03T11:05:00Z",
    display_name: "코린이",
    email: "coder_beginner@example.com",
    has_reply: false,
  },
  {
    id: "comment_7",
    content: "이거 정말 유용하네요. RLS 설정할 때 참고하겠습니다.",
    created_at: "2025-11-05T17:00:00Z",
    parent_id: null,
    updated_at: "2025-11-05T17:00:00Z",
    display_name: "데이터베이스맨",
    email: "db_man@example.com",
    has_reply: true,
  },
  {
    id: "comment_8",
    content: "혹시 'update' 권한은 어떻게 주나요?",
    created_at: "2025-11-05T17:02:00Z",
    parent_id: "comment_7",
    updated_at: "2025-11-05T17:02:00Z",
    display_name: "수파베이스뉴비",
    email: "supabase_newbie@example.com",
    has_reply: false,
  },
  {
    id: "comment_9",
    content: "페르소나 프롬프트, 코드 리뷰 말고 다른 곳에도 쓸 수 있을까요?",
    created_at: "2025-11-06T09:00:00Z",
    parent_id: null,
    updated_at: null,
    display_name: "GPT활용가",
    email: "gpt_user@example.com",
    has_reply: false,
  },
  {
    id: "comment_10",
    content:
      "tailwind.config.js에서 `darkMode: 'class'` 설정하는 걸 잊지 마세요!",
    created_at: "2025-11-07T13:20:00Z",
    parent_id: null,
    updated_at: "2025-11-07T13:20:00Z",
    display_name: "CSS러버",
    email: "css_lover@example.com",
    has_reply: false,
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
                <p>{post.user_id}</p>
                <p className="text-[#717182] text-sm">
                  {post.email} · {post.created_at.slice(0, 10)}
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
              <p className="text-[18px] font-medium">{post.title}</p>
              <p>{post.content}</p>
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
              <span key={i}>#{tag}</span>
            ))}
          </div>
        </div>
        {/* 아래 버튼들 */}
        <div className="flex justify-center gap-30 text-[#717182]">
          <button className="cursor-pointer py-1 px-2 rounded-md hover:text-[#FF569B] hover:bg-[#F7E6ED]">
            <div className="flex gap-2 text-sm items-center ">
              <Heart size={18} />
              <span>{post.like_count}</span>
            </div>
          </button>
          <button className="cursor-pointer py-1 px-2 rounded-md hover:bg-gray-200">
            <div className="flex gap-2 text-sm items-center">
              <MessageSquare size={18} />
              <span>{post.comment_count}</span>
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
                  {post.user_id}
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
        <CommentForm postId={post.id} />
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
