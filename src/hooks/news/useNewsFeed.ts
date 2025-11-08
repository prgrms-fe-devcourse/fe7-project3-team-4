"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client"; 
import { SortKey, NewsItemWithState, NewsRow } from "@/types";

// [수정] PAGE_SIZE 상수를 파일 내부에 다시 정의
export const PAGE_SIZE = 10; 

// type NewsQueryData = NewsRow & {
//   user_news_likes: { user_id: string }[];
//   user_news_bookmarks: { user_id: string }[];
// };

export function useNewsFeed(initialSortBy: SortKey = "published_at") {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newsList, setNewsList] = useState<NewsItemWithState[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>(initialSortBy);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [message, setMessage] = useState("");

  const observerRef = useRef<IntersectionObserver | null>(null);

  // [수정] 데이터 로드 함수 (좋아요/북마크 JOIN 로직 추가)
  const fetchNews = useCallback(
    async (
      currentSortBy: SortKey,
      pageToFetch: number,
      isInitialLoad = false
    ) => {
      await Promise.resolve();

      if (isInitialLoad) setIsLoading(true);
      else setIsLoadingMore(true);

      setMessage("");

      // 1. 현재 로그인한 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const from = pageToFetch * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // 2. Select 쿼리 수정: 좋아요/북마크 테이블을 join
      let query = supabase
        .from("news")
        .select(
          `
          id, title, site_name, created_at, published_at, images, like_count, view_count, tags,
          user_news_likes!left(user_id),
          user_news_bookmarks!left(user_id)
        `
        )
        // 3. Join된 테이블을 현재 사용자 ID로 필터링
        .filter(
          "user_news_likes.user_id",
          "eq",
          userId || "00000000-0000-0000-0000-000000000000" // 로그아웃 시 dummy UUID
        )
        .filter(
          "user_news_bookmarks.user_id",
          "eq",
          userId || "00000000-0000-0000-0000-000000000000" // 로그아웃 시 dummy UUID
        )
        .range(from, to);


      // 정렬 쿼리
      if (currentSortBy === "published_at") {
        query = query
          .order("published_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
      } else if (currentSortBy === "like_count") {
        query = query
          .order("like_count", { ascending: false, nullsFirst: true })
          .order("view_count", { ascending: false, nullsFirst: true })
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (!error && data) {
         // 4. isLiked, isBookmarked 초기 상태 설정
         // (Supabase 타입 추론이 Join을 완벽히 못할 수 있으므로 any[]로 캐스팅)
        const dataWithState: NewsItemWithState[] = (data as any[]).map((item) => ({
          ...item,
          // join된 배열의 길이가 0보다 크면 true
          isLiked: item.user_news_likes && item.user_news_likes.length > 0,
          isBookmarked: item.user_news_bookmarks && item.user_news_bookmarks.length > 0,
          // join으로 생성된 임시 배열 제거
          user_news_likes: undefined, 
          user_news_bookmarks: undefined,
        }));

        if (isInitialLoad) {
          setNewsList(dataWithState);
        } else {
          setNewsList((prev) => [...prev, ...dataWithState]);
        }

        setPage(pageToFetch);
        setHasNextPage(data.length === PAGE_SIZE);
      } else {
        console.error(error);
        setMessage("❌ 목록을 불러오는 중 오류가 발생했습니다.");
      }

      if (isInitialLoad) setIsLoading(false);
      else setIsLoadingMore(false);
    },
    [] // 의존성 배열이 비어있으므로 fetchNews 함수 자체는 재생성되지 않음.
  );

  // 정렬 변경 또는 목록 초기화 시 데이터 로드
  useEffect(() => {
    // newsList.length === 0 일 때 (초기 로드 또는 정렬 변경)
    // + 현재 로딩 중이 아닐 때만 fetch
    if (newsList.length === 0 && hasNextPage && !isLoading && !isLoadingMore) {
      fetchNews(sortBy, 0, true);
    }
  }, [sortBy, fetchNews, newsList.length, isLoading, isLoadingMore, hasNextPage]);

  // 무한 스크롤 옵저버
  const loadMoreTriggerRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          // 다음 페이지 로드 (isInitialLoad = false)
          fetchNews(sortBy, page + 1, false);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMore, hasNextPage, fetchNews, sortBy, page]
  );

  // 정렬 변경 핸들러
  const handleSortChange = (key: SortKey) => {
    if (key === sortBy) return; // 이미 같은 정렬이면 무시
    setSortBy(key);
    setNewsList([]); // 목록을 비워 useEffect가 새로 로드하도록 함
    setPage(0);
    setHasNextPage(true);
  };

  // [수정] 좋아요 토글 (새 스키마 적용)
  const handleLikeToggle = async (id: string) => {
    // 1. 사용자 로그인 상태 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      // TODO: router.push('/auth/login') 등 라우팅 로직 추가
      return;
    }

    let originalList: NewsItemWithState[] = [];
    let isCurrentlyLiked = false; // 롤백을 위해 현재 상태 기록

    // 2. 옵티미스틱 UI 업데이트
    setNewsList((prev) => {
      originalList = prev;
      return prev.map((item) => {
        if (item.id === id) {
          isCurrentlyLiked = item.isLiked; // 현재 상태 저장
          return {
            ...item,
            isLiked: !item.isLiked,
            // like_count도 옵티미스틱하게 +/- 1
            like_count: !item.isLiked
              ? (item.like_count ?? 0) + 1
              : Math.max(0, (item.like_count ?? 0) - 1),
          };
        }
        return item;
      });
    });

    // 3. DB 호출
    try {
      if (isCurrentlyLiked) {
        // 좋아요 취소 (DELETE)
        const { error } = await supabase
          .from("user_news_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", id);
        if (error) throw error;
      } else {
        // 좋아요 (INSERT)
        const { error } = await supabase
          .from("user_news_likes")
          .insert({ user_id: user.id, news_id: id });
        if (error) throw error;
      }
      // like_count는 DB 트리거가 자동으로 업데이트합니다.
    } catch (err: unknown) {
      console.error("[LikeToggle Error]", err instanceof Error ? err.message : String(err));
      // 4. 롤백: 오류 발생 시 원래 목록으로 되돌림
      setMessage("❌ 좋아요 처리에 실패했습니다.");
      setNewsList(originalList); // 저장해둔 원본 목록으로 롤백
    }
  };

  // [수정] 북마크 토글 (새 스키마 적용)
  const handleBookmarkToggle = async (id: string) => {
    // 1. 사용자 로그인 상태 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      // TODO: router.push('/auth/login') 등 라우팅 로직 추가
      return;
    }

    let originalList: NewsItemWithState[] = [];
    let isCurrentlyBookmarked = false; // 롤백을 위해 현재 상태 기록

    // 2. 옵티미스틱 UI 업데이트
    setNewsList((prev) => {
      originalList = prev;
      return prev.map((item) => {
        if (item.id === id) {
          isCurrentlyBookmarked = item.isBookmarked; // 현재 상태 저장
          return {
            ...item,
            isBookmarked: !item.isBookmarked,
          };
        }
        return item;
      });
    });

    // 3. DB 호출
    try {
      if (isCurrentlyBookmarked) {
        // 북마크 취소 (DELETE)
        const { error } = await supabase
          .from("user_news_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", id);
        if (error) throw error;
      } else {
        // 북마크 (INSERT)
        const { error } = await supabase
          .from("user_news_bookmarks")
          .insert({ user_id: user.id, news_id: id });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("[BookmarkToggle Error]", err.message);
      // 4. 롤백: 오류 발생 시 원래 목록으로 되돌림
      setMessage("❌ 북마크 처리에 실패했습니다.");
      setNewsList(originalList); // 저장해둔 원본 목록으로 롤백
    }
  };


  // 피드 강제 새로고침 (업로드 성공 시 호출)
  const refreshFeed = () => {
    setNewsList([]);
    setPage(0);
    setHasNextPage(true);
    // newsList가 []로 설정되면, useEffect가 자동으로 fetchNews(sortBy, 0, true)를 호출
  };

  // 최신 뉴스 계산
  const lastedNews = useMemo(() => {
    return [...newsList]
      .sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      })
      .slice(0, 10); // 상위 10개
  }, [newsList]);

  return {
    isLoading,
    isLoadingMore,
    newsList,
    message,
    setMessage,
    hasNextPage,
    sortBy,
    handleSortChange,
    handleLikeToggle,
    handleBookmarkToggle,
    loadMoreTriggerRef,
    refreshFeed,
    lastedNews,
  };
}