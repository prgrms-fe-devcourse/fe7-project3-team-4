"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { SortKey, NewsItemWithState } from "@/types";

export const PAGE_SIZE = 10;

// [수정] 1. Supabase JOIN 결과를 위한 타입 정의 (any[] 대체)
type SupabaseNewsItem = Omit<NewsItemWithState, "isLiked" | "isBookmarked"> & {
  user_news_likes: { user_id: string }[] | null;
  user_news_bookmarks: { user_id: string }[] | null;
};

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

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const from = pageToFetch * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("news")
        .select(
          `
          id, title, site_name, created_at, published_at, images, like_count, view_count, tags,
          user_news_likes!left(user_id),
          user_news_bookmarks!left(user_id)
        `
        )
        .filter(
          "user_news_likes.user_id",
          "eq",
          userId || "00000000-0000-0000-0000-000000000000"
        )
        .filter(
          "user_news_bookmarks.user_id",
          "eq",
          userId || "00000000-0000-0000-0000-000000000000"
        )
        .range(from, to);

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
        // [수정] 2. (data as any[]) 대신 정의한 타입 사용
        const typedData = data as SupabaseNewsItem[];

        const dataWithState: NewsItemWithState[] = typedData.map((item) => ({
          ...item,
          isLiked: !!(item.user_news_likes && item.user_news_likes.length > 0),
          isBookmarked: !!(
            item.user_news_bookmarks && item.user_news_bookmarks.length > 0
          ),
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
        console.error(
          "Supabase fetch error:",
          error?.message || JSON.stringify(error)
        );
        setMessage("❌ 목록을 불러오는 중 오류가 발생했습니다.");
      }

      if (isInitialLoad) setIsLoading(false);
      else setIsLoadingMore(false);
    },
    [supabase] // [수정] 3. supabase 의존성 추가 (setter 함수들은 안정적이라 필요 X)
  );

  // 정렬 변경 또는 목록 초기화 시 데이터 로드
  useEffect(() => {
    if (newsList.length === 0 && hasNextPage && !isLoading && !isLoadingMore) {
      fetchNews(sortBy, 0, true);
    }
  }, [
    sortBy,
    fetchNews,
    newsList.length,
    isLoading,
    isLoadingMore,
    hasNextPage,
  ]);

  // 무한 스크롤 옵저버
  const loadMoreTriggerRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          fetchNews(sortBy, page + 1, false);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMore, hasNextPage, fetchNews, sortBy, page]
  );

  // 정렬 변경 핸들러
  // [수정] 4. useCallback 래핑
  const handleSortChange = useCallback(
    (key: SortKey) => {
      if (key === sortBy) return;
      setSortBy(key);
      setNewsList([]);
      setPage(0);
      setHasNextPage(true);
    },
    [sortBy] // sortBy만 의존 (setter는 안정적)
  );

  // 좋아요 토글
  // [수정] 4. useCallback 래핑
  const handleLikeToggle = useCallback(
    async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      let originalList: NewsItemWithState[] = [];
      let isCurrentlyLiked = false;

      setNewsList((prev) => {
        originalList = prev;
        return prev.map((item) => {
          if (item.id === id) {
            isCurrentlyLiked = item.isLiked;
            return {
              ...item,
              isLiked: !item.isLiked,
              like_count: !item.isLiked
                ? (item.like_count ?? 0) + 1
                : Math.max(0, (item.like_count ?? 0) - 1),
            };
          }
          return item;
        });
      });

      try {
        if (isCurrentlyLiked) {
          const { error } = await supabase
            .from("user_news_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("news_id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_news_likes")
            .insert({ user_id: user.id, news_id: id });
          if (error) throw error;
        }
      } catch (err: unknown) {
        // [수정] 4. any -> unknown 및 타입 가드
        console.error(
          "[LikeToggle Error]",
          err instanceof Error ? err.message : JSON.stringify(err)
        );
        setMessage("❌ 좋아요 처리에 실패했습니다.");
        setNewsList(originalList);
      }
    },
    [supabase] // supabase 의존성 추가 (setter는 안정적)
  );

  // 북마크 토글
  // [수정] 4. useCallback 래핑
  const handleBookmarkToggle = useCallback(
    async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      let originalList: NewsItemWithState[] = [];
      let isCurrentlyBookmarked = false;

      setNewsList((prev) => {
        originalList = prev;
        return prev.map((item) => {
          if (item.id === id) {
            isCurrentlyBookmarked = item.isBookmarked;
            return {
              ...item,
              isBookmarked: !item.isBookmarked,
            };
          }
          return item;
        });
      });

      try {
        if (isCurrentlyBookmarked) {
          const { error } = await supabase
            .from("user_news_bookmarks")
            .delete()
            .eq("user_id", user.id)
            .eq("news_id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_news_bookmarks")
            .insert({ user_id: user.id, news_id: id });
          if (error) throw error;
        }
      } catch (err: unknown) {
        // [수정] 4. any -> unknown 및 타입 가드
        console.error(
          "[BookmarkToggle Error]",
          err instanceof Error ? err.message : JSON.stringify(err)
        );
        setMessage("❌ 북마크 처리에 실패했습니다.");
        setNewsList(originalList);
      }
    },
    [supabase] // supabase 의존성 추가 (setter는 안정적)
  );

  // 피드 강제 새로고침
  // [수정] 4. useCallback 래핑
  const refreshFeed = useCallback(() => {
    setNewsList([]);
    setPage(0);
    setHasNextPage(true);
  }, []); // setter 함수들만 사용하므로 의존성 없음

  // 최신 뉴스 계산
  const latestNews = useMemo(() => {
    return [...newsList]
      .sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      })
      .slice(0, 10);
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
    latestNews,
  };
}
