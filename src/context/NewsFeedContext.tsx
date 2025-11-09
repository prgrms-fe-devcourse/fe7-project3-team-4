"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useRef,
  useState, // [추가]
  useEffect, // [추가]
} from "react";
import { useNewsFeed } from "@/hooks/news/useNewsFeed";
import { useNewsUpload } from "@/hooks/news/useNewsUpload";
import { SortKey, NewsItemWithState } from "@/types";
import { createClient } from "@/utils/supabase/client"; // [추가]

// [추가] LatestNewsCarousel이 요구하는 최소한의 타입
type LatestNews = {
  id: string;
  title: string;
  images?: string[] | null;
};

// 1. useNewsFeed와 useNewsUpload 훅의 반환 타입을 합칩니다.
// [수정] useNewsFeed의 반환 타입에서 latestNews를 제거하고,
//       독립적인 latestNews 타입을 수동으로 추가합니다.
type NewsFeedContextType = Omit<ReturnType<typeof useNewsFeed>, "latestNews"> & {
  fileInputRef: React.RefObject<HTMLInputElement>;
  loadingUpload: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  latestNews: LatestNews[]; // [수정]
};

// 2. Context 생성
const NewsFeedContext = createContext<NewsFeedContextType | undefined>(undefined);

// 3. Provider 컴포넌트 생성
export function NewsFeedProvider({ children }: { children: ReactNode }) {
  // 메인 피드 로직 (정렬, 무한 스크롤 등)
  const newsFeed = useNewsFeed("published_at");

  // 업로드 로직
  const newsUpload = useNewsUpload({
    onUploadStart: () => newsFeed.setMessage("업로드 중..."),
    onUploadSuccess: () => {
      newsFeed.setMessage("✅ 기사 저장 완료! 목록을 새로고침합니다.");
      newsFeed.refreshFeed();
      // [추가] 업로드 성공 시 캐러셀도 갱신
      fetchLatestNews();
    },
    onUploadError: (errorMessage) => newsFeed.setMessage(errorMessage),
  });

  // [추가] 캐러셀 전용 상태 및 fetch 로직
  const [latestNews, setLatestNews] = useState<LatestNews[]>([]);
  const supabase = createClient();

  const fetchLatestNews = async () => {
    // 캐러셀은 id, title, images 필드만 필요합니다.
    const { data, error } = await supabase
      .from("news")
      .select("id, title, images")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(10); // 캐러셀은 10개만

    if (error) {
      console.error("Error fetching latest news for carousel:", error.message);
    } else if (data) {
      setLatestNews(data);
    }
  };

  // 컴포넌트 마운트 시 캐러셀 데이터 1회 로드
  useEffect(() => {
    fetchLatestNews();
  }, []);

  // 두 훅의 반환값을 하나로 합쳐서 value로 제공
  const value = {
    ...newsFeed,
    ...newsUpload,
    latestNews, // [수정] useNewsFeed에서 온 것이 아닌, 독립적인 상태를 제공
  };

  return (
    <NewsFeedContext.Provider value={value}>
      {children}
    </NewsFeedContext.Provider>
  );
}

// 4. Consumer 커스텀 훅 생성 (변경 없음)
export function useNewsFeedContext() {
  const context = useContext(NewsFeedContext);
  if (context === undefined) {
    throw new Error("useNewsFeedContext must be used within a NewsFeedProvider");
  }
  return context;
}