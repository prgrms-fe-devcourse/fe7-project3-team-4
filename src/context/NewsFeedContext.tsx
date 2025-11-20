"use client";

import {
  createContext,
  useContext,
  ReactNode,
  // useRef,
  useState,
  useEffect,
  useCallback, // [추가]
} from "react";
import { useNewsFeed } from "@/hooks/news/useNewsFeed";
import { useNewsUpload } from "@/hooks/news/useNewsUpload";
// import { SortKey, NewsItemWithState } from "@/types";
import { createClient } from "@/utils/supabase/client";

// LatestNewsCarousel이 요구하는 최소한의 타입
type LatestNews = {
  id: string;
  title: string;
  images?: string[] | null;
};

// 1. useNewsFeed와 useNewsUpload 훅의 반환 타입을 합칩니다.
type NewsFeedContextType = Omit<ReturnType<typeof useNewsFeed>, "latestNews"> & {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  loadingUpload: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  triggerFileInput: () => void;
  latestNews: LatestNews[];
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
      // [수정] useCallback으로 생성된 함수 호출
      fetchLatestNews();
    },
    onUploadError: (errorMessage) => newsFeed.setMessage(errorMessage),
  });

  // 캐러셀 전용 상태 및 fetch 로직
  const [latestNews, setLatestNews] = useState<LatestNews[]>([]);
  const supabase = createClient();

  // [수정] 함수를 useCallback으로 감싸서 메모이제이션합니다.
  const fetchLatestNews = useCallback(async () => {
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
    // [수정] useCallback의 의존성 배열에 supabase 클라이언트 추가
  }, [supabase]); 

  // 컴포넌트 마운트 시 캐러셀 데이터 1회 로드
  useEffect(() => {
    fetchLatestNews();
    // [수정] 의존성 배열에 fetchLatestNews 추가
  }, [fetchLatestNews]);

  // 두 훅의 반환값을 하나로 합쳐서 value로 제공
  const value = {
    ...newsFeed,
    ...newsUpload,
    latestNews,
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