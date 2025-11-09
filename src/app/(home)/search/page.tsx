import Post from "@/components/home/Post";
import { createClient } from "@/utils/supabase/server";
import { Search, SendHorizonal } from "lucide-react";

const MOCKUP_DATA: Post[] = [
  // [수정] 'news' 타입 Mock 데이터는 제거해도 됩니다 (ID: 1, 2, 9).
  // 여기서는 편의상 그대로 두되, 'all' 탭에서만 사용합니다.
  {
    id: 1,
    type: "news",
    model: "Gemini",
    author: "ALGO Editor",
    email: "editor@algo.news",
    createdAt: "2025-11-08T10:12:00+09:00",
    title: "Gemini 2.0, 한국어 코드 어시스트 정식 지원",
    content:
      "Gemini 2.0이 한국어 기반 코드 어시스트 기능을 정식 지원하며, React/Next.js 프로젝트 생산성이 크게 향상될 것으로 기대됩니다.",
    image:
      "https://cdn.pixabay.com/photo/2025/11/05/20/57/monastery-9939590_1280.jpg",
    hashtags: ["#Gemini", "#업데이트", "#코드어시스트"],
    likes: 42,
    comments: 7,
    isBookmarked: true,
  },
  {
    id: 2,
    type: "news",
    model: "GPT",
    author: "ALGO Insight",
    email: "insight@algo.news",
    createdAt: "2025-11-07T21:30:00+09:00",
    title: "GPT 모델, 프롬프트 보안 가이드라인 업데이트",
    content:
      "OpenAI의 최신 문서에 따라 민감 정보 마스킹, 역할 분리 전략 등 프롬프트 보안 패턴이 정리되었습니다.",
    hashtags: ["#GPT", "#보안", "#프롬프트엔지니어링"],
    likes: 31,
    comments: 5,
    isBookmarked: false,
  },
  {
    id: 3,
    type: "prompt",
    model: "Gemini",
    author: "yeon.codes",
    email: "yeon@algo.dev",
    createdAt: "2025-11-08T09:05:00+09:00",
    title: "[UI] 글래스모피즘 대시보드 한 번에 뽑기",
    content:
      "“글래스모피즘 카드 4개와 상단 요약 영역을 가진, 밝은 톤의 SaaS 대시보드 레이아웃을 Tailwind 코드와 함께 제안해줘.”",
    hashtags: ["#UI프롬프트", "#Glassmorphism", "#Tailwind"],
    likes: 56,
    comments: 12,
    isBookmarked: true,
  },
  {
    id: 4,
    type: "prompt",
    model: "GPT",
    author: "frontend-owl",
    email: "owl@algo.dev",
    createdAt: "2025-11-06T18:44:00+09:00",
    title: "[Dev] Next.js 캐싱 전략 설명 프롬프트",
    content:
      "“CSR, SSR, SSG, ISR 차이를 시니어 프론트엔드 면접 수준으로 예시와 함께 설명해줘. 표와 코드 샘플도 포함해줘.”",
    hashtags: ["#Nextjs", "#면접준비", "#캐싱"],
    likes: 24,
    comments: 3,
    isBookmarked: false,
  },
  {
    id: 5,
    type: "free",
    author: "moonlight",
    email: "moon@algo.community",
    createdAt: "2025-11-08T00:22:00+09:00",
    title: "오늘의 실패: 프롬프트를 너무 길게 써버렸다",
    content:
      "LLM이 중간에 요약해버려서 중요한 조건이 날아갔어요. 핵심 조건은 bullet로 먼저 정리하는 게 좋더라구요.",
    hashtags: ["#프롬프트팁", "#실패공유"],
    likes: 17,
    comments: 4,
    isBookmarked: false,
  },
  {
    id: 6,
    type: "free",
    author: "glassdev",
    email: "glass@algo.community",
    createdAt: "2025-11-07T14:10:00+09:00",
    title: "다들 Gemini랑 GPT 어떤 비율로 쓰세요?",
    content:
      "UI는 Gemini, 알고리즘 문제 해설은 GPT 위주로 쓰는 중인데, 여러분 워크플로우도 궁금합니다.",
    hashtags: ["#툴사용법", "#GPT", "#Gemini"],
    likes: 29,
    comments: 11,
    isBookmarked: true,
  },
  {
    id: 7,
    type: "weekly",
    model: "이미지",
    author: "ALGO Weekly Bot",
    email: "weekly@algo.news",
    createdAt: "2025-11-03T09:00:00+09:00",
    title: "W44: 프롬프트 실험 TOP 5 & AI 업데이트 요약",
    content:
      "이번 주 인기 프롬프트, Gemini/GPT 주요 업데이트, 그리고 커뮤니티에서 많이 저장된 인사이트를 모아봤어요.",
    image:
      "https://cdn.pixabay.com/photo/2024/09/28/20/09/city-9082149_640.jpg",
    hashtags: ["#Weekly", "#업데이트요약"],
    likes: 64,
    comments: 9,
    isBookmarked: true,
  },
  {
    id: 8,
    type: "weekly",
    model: "텍스트",
    author: "ALGO Weekly Bot",
    email: "weekly@algo.news",
    createdAt: "2025-10-27T09:00:00+09:00",
    title: "W43: 한국어 프롬프트 베스트 컬렉션",
    content:
      "실제 서비스 개발에 사용된 한국어 프롬프트 10개를 선별해 정리했습니다.",
    hashtags: ["#Weekly", "#한국어프롬프트"],
    likes: 51,
    comments: 6,
    isBookmarked: false,
  },
  {
    id: 9,
    type: "news",
    model: "Gemini",
    author: "ALGO Lab",
    email: "lab@algo.news",
    createdAt: "2025-11-05T16:20:00+09:00",
    title: "Gemini 이미지 이해력 향상: UI 시안 피드백 활용 사례",
    content:
      "디자이너들이 업로드한 와이어프레임을 기반으로 Gemini가 컴포넌트 구조와 컬러 토큰까지 제안한 사례가 공유되었습니다.",
    hashtags: ["#Gemini", "#디자인", "#UI워크플로우"],
    likes: 33,
    comments: 2,
    isBookmarked: false,
  },
  {
    id: 10,
    type: "prompt",
    model: "GPT",
    author: "algo-admin",
    email: "admin@algo.dev",
    createdAt: "2025-11-08T11:00:00+09:00",
    title: "[CS] 정보처리기사 실기 대비 자동 문제 세트 생성",
    content:
      "“정보처리기사 실기 2025 기준으로, 관계형 DB/네트워크/보안/알고리즘 파트를 섞어 20문항 실전 모의고사를 만들어줘. 정답과 해설도 포함해.”",
    hashtags: ["#자격증", "#GPT프롬프트", "#문제생성"],
    likes: 48,
    comments: 10,
    isBookmarked: true,
  },
];

const TAG_LABEL_MAP: Record<string, string> = {
  education: "교육",
  writing: "글쓰기",
  business: "비즈니스",
  script: "스크립트",
  marketing: "마케팅",
  content: "콘텐츠",
  research: "조사",
  play: "놀이",
  sns: "SNS",
  art: "디자인",
  develop: "개발",
  summary: "요약",
};

const SECTION_TITLE_MAP: Record<"prompt" | "free" | "weekly", string> = {
  prompt: "프롬프트",
  free: "자유",
  weekly: "주간",
};

export default async function Page() {
  const supabase = await createClient();
  const { data: tagData } = await supabase.from("hashtags").select("*");
  if (!tagData) return null;

  const postsByType = {
    prompt: MOCKUP_DATA.filter((post) => post.type === "prompt"),
    free: MOCKUP_DATA.filter((post) => post.type === "free"),
    weekly: MOCKUP_DATA.filter((post) => post.type === "weekly"),
  };

  return (
    <>
      <section className="max-w-2xl mx-auto">
        {/* 검색 입력 창 */}
        <form className="p-4 flex gap-3 bg-white border border-[#F6F6F8] rounded-xl shadow mb-4">
          <Search size={20} className="text-[#D1D5DB]" />
          <input
            type="text"
            placeholder="검색하기..."
            className="flex-1 outline-none"
          />
          <button type="submit" className="cursor-pointer text-[#D1D5DB]">
            <SendHorizonal size={20} />
          </button>
        </form>
        {/* 인기 해시태그 */}
        <div className="space-y-2 px-6 py-4 bg-white/40 border-white/20 rounded-xl shadow-xl mb-8">
          <p>인기 해시태그</p>
          <div className="flex gap-2.5 flex-wrap">
            {tagData.map((tag) => {
              if (!tag.name) return null;
              const label = TAG_LABEL_MAP[tag.name] ?? tag.name;
              return (
                <button
                  key={tag.id}
                  className="cursor-pointer px-2.5 py-1.5 text-xs text-[#4B5563] border border-[#D9D9D9] rounded-lg hover:bg-[#ECE9FF]"
                >
                  #{label}
                </button>
              );
            })}
          </div>
        </div>
        {/* 검색 영역 */}

        {/* 타입별 섹션 렌더링 */}
        {(Object.keys(postsByType) as Array<keyof typeof postsByType>).map(
          (type) => {
            const posts = postsByType[type];
            if (!posts.length) return null;

            const title = SECTION_TITLE_MAP[type];

            return (
              <div key={type} className="space-y-4 mb-8">
                <p className="ml-6 text-xl">{title}</p>
                <div className="space-y-8 pb-6">
                  {posts.map((post) => (
                    <Post key={post.id} data={post} />
                  ))}
                </div>
              </div>
            );
          }
        )}
      </section>
    </>
  );
}
