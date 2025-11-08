import Post from "./Post";

const MOCKUP_DATA: Post[] = [
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
    image: "",
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
    image: "",
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
    image: "",
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
    image: "",
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
    image: "",
    hashtags: ["#툴사용법", "#GPT", "#Gemini"],
    likes: 29,
    comments: 11,
    isBookmarked: true,
  },
  {
    id: 7,
    type: "weekly",
    author: "ALGO Weekly Bot",
    email: "weekly@algo.news",
    createdAt: "2025-11-03T09:00:00+09:00",
    title: "W44: 프롬프트 실험 TOP 5 & AI 업데이트 요약",
    content:
      "이번 주 인기 프롬프트, Gemini/GPT 주요 업데이트, 그리고 커뮤니티에서 많이 저장된 인사이트를 모아봤어요.",
    image:
      "https://cdn.pixabay.com/photo/2025/10/02/06/28/mood-9867715_640.jpg",
    hashtags: ["#Weekly", "#업데이트요약"],
    likes: 64,
    comments: 9,
    isBookmarked: true,
  },
  {
    id: 8,
    type: "weekly",
    author: "ALGO Weekly Bot",
    email: "weekly@algo.news",
    createdAt: "2025-10-27T09:00:00+09:00",
    title: "W43: 한국어 프롬프트 베스트 컬렉션",
    content:
      "실제 서비스 개발에 사용된 한국어 프롬프트 10개를 선별해 정리했습니다.",
    image: "",
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
    image: "",
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
    image: "",
    hashtags: ["#자격증", "#GPT프롬프트", "#문제생성"],
    likes: 48,
    comments: 10,
    isBookmarked: true,
  },
];

export default function All() {
  return (
    <>
      <div className="space-y-8">
        {MOCKUP_DATA.map((data) => {
          return <Post key={data.id} data={data} />;
        })}
      </div>
    </>
  );
}
