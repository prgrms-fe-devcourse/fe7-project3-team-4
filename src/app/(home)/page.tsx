"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import All from "@/components/home/All";
// import News from "@/components/home/News"; // [제거]
import Prompt from "@/components/home/Prompt";
import TopBar from "@/components/home/TobBar";
import Free from "@/components/home/Free";
import Weekly from "@/components/home/Weekly";
import PostDetail from "@/components/home/post/PostDetail";

// [추가] (news) 관련 컴포넌트 및 컨텍스트 임포트
import { useNewsFeedContext } from "@/context/NewsFeedContext";
import NewsFeed from "@/components/news/NewsFeed";
import FeedStatus from "@/components/news/FeedStatus";
import { FadeLoader } from "react-spinners";
import IntroAnimation from "@/components/intro/IntroAnimation";

const MOCKUP_DATA: Post[] = [
  // [수정] 'news' 타입 Mock 데이터는 제거해도 됩니다 (ID: 1, 2, 9).
  // 여기서는 편의상 그대로 두되, 'all' 탭에서만 사용합니다.

  {
    id: "1",
    comment_count: 5,
    content:
      "const [state, setState] = useState(initialState);\n// React에서 상태를 관리하는 가장 기본적인 방법입니다.\n// ... (더 많은 예시 코드)",
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-11-01T12:30:00Z",
    like_count: 15,
    post_type: "prompt",
    title: "React state 관리 마스터 프롬프트",
    user_id: "user_abc_123",
    view_count: 102,
    email: "react_master@example.com",
    image:
      "https://cdn.pixabay.com/photo/2025/11/05/20/57/monastery-9939590_1280.jpg",
    hashtags: ["React", "JavaScript", "Frontend", "StateManagement"],
    isBookmarked: true,
    model: "GPT",
  },
  {
    id: "2",
    comment_count: 2,
    content:
      "Next.js 14 버전에서 ISR을 설정하는 방법입니다. revalidate 옵션을 사용하세요...",
    created_at: "2025-11-02T14:20:00Z",
    like_count: 8,
    post_type: "free",
    title: "Next.js ISR 질문 있습니다.",
    user_id: "user_def_456",
    view_count: 55,
    email: "next_fan@example.com",
    hashtags: ["NextJS", "ISR", "WebDev"],
    isBookmarked: false,
    model: "Gemini",
  },
  {
    id: "3",
    comment_count: 10,
    content:
      "가장 효율적인 피보나치 수열 알고리즘을 작성하는 챌린지입니다. 재귀, DP, 반복문 등 다양한 방법을 시도해보세요.",
    created_at: "2025-11-03T09:00:00Z",
    like_count: 25,
    post_type: "weekly",
    title: "챌린지: 피보나치 수열 최적화",
    user_id: "user_ghi_789",
    view_count: 230,
    email: "algo_king@example.com",
    image:
      "https://cdn.pixabay.com/photo/2025/11/05/20/57/monastery-9939590_1280.jpg",
    hashtags: ["Algorithm", "Challenge", "DP", "Optimization"],
    isBookmarked: true,
  },
  {
    id: "4",
    comment_count: 0,
    content:
      "Gemini API를 사용하여 실시간 번역 기능을 구현하는 프롬프트를 공유합니다. 'Translate this text to [Language]: [Text]'...",
    created_at: "2025-11-04T11:00:00Z",
    like_count: 12,
    post_type: "prompt",
    title: "Gemini 실시간 번역 프롬프트",
    user_id: "user_jkl_101",
    view_count: 80,
    email: "gemini_dev@example.com",
    hashtags: ["Gemini", "AI", "Translation", "API"],
    isBookmarked: false,
    model: "Gemini",
  },
  {
    id: "5",
    comment_count: 3,
    content:
      "Supabase RLS 설정하다가 막혔는데, authenticated 유저에게만 'select' 권한을 주려면 어떻게 해야 하나요?",
    created_at: "2025-11-05T16:45:00Z",
    like_count: 4,
    post_type: "free",
    title: "Supabase RLS 관련 질문",
    user_id: "user_mno_202",
    view_count: 60,
    email: "supabase_newbie@example.com",
    hashtags: ["Supabase", "Database", "RLS", "Auth"],
    isBookmarked: false,
  },
  {
    id: "6",
    comment_count: 7,
    content:
      "'당신은 10년차 시니어 개발자입니다. 주니어 개발자의 코드 리뷰를 도와주세요.' 이 프롬프트 하나면 코드 퀄리티가 달라집니다.",
    created_at: "2025-11-06T08:30:00Z",
    like_count: 30,
    post_type: "prompt",
    title: "코드 리뷰 효율 올려주는 GPT 페르소나",
    user_id: "user_pqr_303",
    view_count: 175,
    email: "senior_dev@example.com",
    image:
      "https://cdn.pixabay.com/photo/2024/09/28/20/09/city-9082149_640.jpg",
    hashtags: ["GPT", "CodeReview", "Persona", "Productivity"],
    isBookmarked: true,
    model: "GPT",
  },
  {
    id: "7",
    comment_count: 1,
    content:
      "Tailwind CSS로 다크 모드 구현하는 가장 쉬운 방법은 무엇일까요? `dark:` 클래스를 사용하는 것 외에 팁이 있나요?",
    created_at: "2025-11-07T13:10:00Z",
    updated_at: "2025-11-07T13:15:00Z",
    like_count: 6,
    post_type: "free",
    title: "Tailwind 다크 모드 질문",
    user_id: "user_stu_404",
    view_count: 45,
    email: "css_lover@example.com",
    hashtags: ["TailwindCSS", "CSS", "DarkMode"],
    isBookmarked: false,
  },
  {
    id: "8",
    comment_count: 15,
    content:
      "주어진 이미지 URL을 분석하여 이미지의 주요 색상 팔레트를 JSON 형태로 반환하는 AI 프롬프트를 작성해보세요.",
    created_at: "2025-11-08T10:00:00Z",
    like_count: 22,
    post_type: "weekly",
    title: "챌린지: 이미지 색상 추출 프롬프트",
    user_id: "user_vwx_505",
    view_count: 190,
    email: "design_ai@example.com",
    hashtags: ["AI", "ImageProcessing", "JSON", "Challenge", "Gemini"],
    isBookmarked: true,
    model: "Gemini",
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

    return MOCKUP_DATA.find((post) => post.id === id) ?? null;
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
      prompt: MOCKUP_DATA.filter((post) => post.post_type === "prompt"),
      free: MOCKUP_DATA.filter((post) => post.post_type === "free"),
      weekly: MOCKUP_DATA.filter((post) => post.post_type === "weekly"),
    }),
    []
  );

  return (
    <>
      <IntroAnimation />
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
    </>
  );
}
