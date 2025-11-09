"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import All from "@/components/home/All";
// import News from "@/components/home/News"; // [제거]
import Prompt from "@/components/home/Prompt";
import TopBar from "@/components/home/TobBar";
import Free from "@/components/home/Free";
import Weekly from "@/components/home/Weekly";
import PostDetail from "@/components/home/PostDetail";

// [추가] (news) 관련 컴포넌트 및 컨텍스트 임포트
import { useNewsFeedContext } from "@/context/NewsFeedContext";
import NewsFeed from "@/components/news/NewsFeed";
import FeedStatus from "@/components/news/FeedStatus";
import { FadeLoader } from "react-spinners";
import { SortKey } from "@/types";

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

type Tab = "전체" | "뉴스" | "프롬프트" | "자유" | "주간";

const typeToTab: Record<string, Tab> = {
  all: "전체",
  news: "뉴스",
  prompt: "프롬프트",
  free: "자유",
  weekly: "주간",
};

const tabToType: Record<Tab, string> = {
  전체: "all",
  뉴스: "news",
  프롬프트: "prompt",
  자유: "free",
  주간: "weekly",
};

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 탭
  const activeTab: Tab = useMemo(() => {
    const type = searchParams.get("type") || "all";
    return typeToTab[type] ?? "전체";
  }, [searchParams]);

  // 현재 선택된 게시글 (쿼리 id)
  const selectedPost = useMemo(() => {
    const id = searchParams.get("id");
    if (!id) return null;

    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;

    return MOCKUP_DATA.find((post) => post.id === numericId) ?? null;
  }, [searchParams]);

  // 탭 선택
  const handleTabChange = (tab: Tab) => {
    const type = tabToType[tab];

    if (type === "all") {
      router.push("/", { scroll: false });
    } else {
      router.push(`/?type=${type}`, { scroll: false });
    }
  };

  const handleBack = () => {
    const type = searchParams.get("type") || "all";
    if (type === "all") {
      router.push("/", { scroll: false });
    } else {
      router.push(`/?type=${type}`, { scroll: false });
    }
  };

  // [수정] 컨텍스트에서 뉴스 관련 모든 상태와 핸들러를 가져옵니다.
  const {
    isLoading,
    isLoadingMore,
    newsList,
    message,
    hasNextPage,
    sortBy,
    handleSortChange,
    handleLikeToggle,
    handleBookmarkToggle,
    loadMoreTriggerRef,
    fileInputRef,
    loadingUpload,
    handleFileChange,
    triggerFileInput,
  } = useNewsFeedContext();

  // 'all' 탭과 'news' 탭을 제외한 나머지 탭은 Mock 데이터를 사용합니다.
  const postsByType = useMemo(
    () => ({
      all: MOCKUP_DATA,
      // 'news'는 newsList가 대체하므로 여기서 제외
      prompt: MOCKUP_DATA.filter((post) => post.type === "prompt"),
      free: MOCKUP_DATA.filter((post) => post.type === "free"),
      weekly: MOCKUP_DATA.filter((post) => post.type === "weekly"),
    }),
    []
  );

  return (
    <section className="max-w-2xl mx-auto">
      {/* [추가] useNewsUpload 훅이 참조할 숨겨진 input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".html,.htm"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="mb-5 sticky top-0 z-20">
        {/* [수정] TopBar에 Context에서 가져온 props 전달 */}
        <TopBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          loadingUpload={loadingUpload}
          onAddPostClick={triggerFileInput}
        />
      </div>

      {selectedPost ? (
        <PostDetail post={selectedPost} onBack={handleBack} />
      ) : (
        <>
          <div className="space-y-8 pb-6">
            {activeTab === "전체" && <All data={postsByType.all} />}

            {/* [수정] '뉴스' 탭을 실제 NewsFeed로 교체 */}
            {activeTab === "뉴스" && (
              <section aria-label="뉴스 피드">
                <FeedStatus
                  isLoading={isLoading}
                  listLength={newsList.length}
                  message={loadingUpload ? "업로드 중..." : message}
                />
                <NewsFeed
                  newsList={newsList}
                  onLikeToggle={handleLikeToggle}
                  onBookmarkToggle={handleBookmarkToggle}
                  isLoading={isLoading}
                />
                <div
                  className="flex justify-center items-center py-6"
                  role="status"
                >
                  {isLoadingMore && (
                    <>
                      <span className="sr-only">추가 로딩 중...</span>
                      <FadeLoader color="#808080" />
                    </>
                  )}
                  {!isLoadingMore && !hasNextPage && newsList.length > 0 && (
                    <p className="text-center text-gray-500">
                      모든 뉴스를 불러왔습니다.
                    </p>
                  )}
                </div>
                <div
                  ref={loadMoreTriggerRef}
                  style={{ height: "1px" }}
                  aria-hidden="true"
                />
              </section>
            )}

            {activeTab === "프롬프트" && <Prompt data={postsByType.prompt} />}
            {activeTab === "자유" && <Free data={postsByType.free} />}
            {activeTab === "주간" && <Weekly data={postsByType.weekly} />}
          </div>
        </>
      )}
    </section>
  );
}