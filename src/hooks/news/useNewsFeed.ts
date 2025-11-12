"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { SortKey, NewsItemWithState, NewsRow } from "@/types";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

export const PAGE_SIZE = 10;

type SupabaseNewsItem = Omit<NewsItemWithState, "isLiked" | "isBookmarked"> & {
  user_news_likes: { user_id: string }[] | null;
  user_news_bookmarks: { user_id: string }[] | null;
};

// 헬퍼 함수들
const handleNewsUpdate = (
  payload: RealtimePostgresChangesPayload<NewsRow>,
  setNewsList: Dispatch<SetStateAction<NewsItemWithState[]>>
) => {
  console.log(
    `[useNewsFeed] ✅ REALTIME [news ${payload.eventType}]:`,
    payload.new || payload.old
  );
  if (payload.eventType === "UPDATE") {
    const updatedNews = payload.new;
    setNewsList((prev) => {
      console.log(`[useNewsFeed] 🔄 Updating news item ID: ${updatedNews.id}`);
      return prev.map((item) =>
        item.id === updatedNews.id
          ? {
              ...item,
              like_count: updatedNews.like_count,
              view_count: updatedNews.view_count,
              title: updatedNews.title,
              tags: updatedNews.tags,
            }
          : item
      );
    });
  }
};

type LikePayload = { news_id: string; user_id: string };
const handleLikeUpdate = (
  payload: RealtimePostgresChangesPayload<LikePayload>,
  setNewsList: Dispatch<SetStateAction<NewsItemWithState[]>>,
  currentUserId: string | null
) => {
  console.log(
    `[useNewsFeed] ✅ REALTIME [user_news_likes ${payload.eventType}]:`,
    payload.new || payload.old
  );

  const actionUserId =
    payload.eventType === "INSERT" ? payload.new.user_id : payload.old.user_id;
  if (actionUserId !== currentUserId) return;

  if (payload.eventType === "INSERT") {
    const newLike = payload.new;
    setNewsList((prev) =>
      prev.map((item) =>
        item.id === newLike.news_id ? { ...item, isLiked: true } : item
      )
    );
  } else if (payload.eventType === "DELETE") {
    const oldLike = payload.old;
    setNewsList((prev) =>
      prev.map((item) =>
        item.id === oldLike.news_id ? { ...item, isLiked: false } : item
      )
    );
  }
};

type BookmarkPayload = { news_id: string; user_id: string };
const handleBookmarkUpdate = (
  payload: RealtimePostgresChangesPayload<BookmarkPayload>,
  setNewsList: Dispatch<SetStateAction<NewsItemWithState[]>>,
  currentUserId: string | null
) => {
  console.log(
    `[useNewsFeed] ✅ REALTIME [user_news_bookmarks ${payload.eventType}]:`,
    payload.new || payload.old
  );

  const actionUserId =
    payload.eventType === "INSERT" ? payload.new.user_id : payload.old.user_id;
  if (actionUserId !== currentUserId) return;

  if (payload.eventType === "INSERT") {
    const newBookmark = payload.new;
    setNewsList((prev) =>
      prev.map((item) =>
        item.id === newBookmark.news_id ? { ...item, isBookmarked: true } : item
      )
    );
  } else if (payload.eventType === "DELETE") {
    const oldBookmark = payload.old;
    setNewsList((prev) =>
      prev.map((item) =>
        item.id === oldBookmark.news_id
          ? { ...item, isBookmarked: false }
          : item
      )
    );
  }
};

export function useNewsFeed(initialSortBy: SortKey = "published_at") {
  const [supabase] = useState(() => createClient());

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newsList, setNewsList] = useState<NewsItemWithState[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>(initialSortBy);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [message, setMessage] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const lastSubscribedUserIdRef = useRef<string | null>(null);
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  const fetchNews = useCallback(
    async (
      currentSortBy: SortKey,
      pageToFetch: number,
      isInitialLoad = false
    ) => {
      console.log(
        `[useNewsFeed] 🔥 fetchNews called - page: ${pageToFetch}, initial: ${isInitialLoad}`
      );

      if (isInitialLoad) setIsLoading(true);
      else setIsLoadingMore(true);

      setMessage("");

      try {
        const userId = userIdRef.current;
        const from = pageToFetch * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        console.log(
          `[useNewsFeed] 🔍 Fetching from ${from} to ${to} for user: ${
            userId || "anon"
          }`
        );

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

        if (error) {
          console.error("[useNewsFeed] ❌ Supabase fetch error:", error);
          setMessage("❌ 목록을 불러오는 중 오류가 발생했습니다.");
          return;
        }

        if (!data) {
          console.warn("[useNewsFeed] ⚠️ No data returned");
          setMessage("데이터가 없습니다.");
          return;
        }

        console.log(`[useNewsFeed] ✅ Fetched ${data.length} items`);

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
          console.log("[useNewsFeed] 🔄 Setting initial news list");
          setNewsList(dataWithState);
          initialLoadDoneRef.current = true;
        } else {
          console.log("[useNewsFeed] ➕ Appending to news list");
          setNewsList((prev) => [...prev, ...dataWithState]);
        }

        setPage(pageToFetch);
        setHasNextPage(data.length === PAGE_SIZE);
      } catch (err) {
        console.error("[useNewsFeed] ❌ Unexpected error:", err);
        setMessage("❌ 예상치 못한 오류가 발생했습니다.");
      } finally {
        if (isInitialLoad) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [supabase]
  );

  const refreshFeed = useCallback(() => {
    console.log("[useNewsFeed] 🔄 Refreshing feed");
    setNewsList([]);
    setPage(0);
    setHasNextPage(true);
    initialLoadDoneRef.current = false;
    fetchNews(sortBy, 0, true);
  }, [fetchNews, sortBy]);

  // ✅ Realtime 구독 설정 (exponential backoff 추가)
  useEffect(() => {
    let isSubscribed = true;

    const setupRealtime = async (userId: string | null) => {
      if (lastSubscribedUserIdRef.current === userId) {
        console.log(
          `[useNewsFeed] ⏸️ Already subscribed for user: ${
            userId || "anon"
          }, skipping...`
        );
        return;
      }

      if (channelRef.current) {
        console.log(`[useNewsFeed] 🧹 Removing old channel`);
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (!isSubscribed) return;

      lastSubscribedUserIdRef.current = userId;
      userIdRef.current = userId;

      const channelName = `news-feed:${userId || "anon"}`;
      const channel = supabase.channel(channelName);
      console.log(`[useNewsFeed] 🚀 Subscribing to: ${channelName}`);

      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "news" },
        (payload) =>
          handleNewsUpdate(
            payload as RealtimePostgresChangesPayload<NewsRow>,
            setNewsList
          )
      );

      if (userId) {
        channel
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_news_likes",
              filter: `user_id=eq.${userId}`,
            },
            (payload) =>
              handleLikeUpdate(
                payload as RealtimePostgresChangesPayload<LikePayload>,
                setNewsList,
                userId
              )
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_news_bookmarks",
              filter: `user_id=eq.${userId}`,
            },
            (payload) =>
              handleBookmarkUpdate(
                payload as RealtimePostgresChangesPayload<BookmarkPayload>,
                setNewsList,
                userId
              )
          );
      }

      channel.subscribe((status, err) => {
        console.log(`[useNewsFeed] Subscription status: ${status}`);
        
        if (status === "SUBSCRIBED") {
          console.log(
            `[useNewsFeed] ✅ SUBSCRIBED successfully for user: ${
              userId || "anon"
            }`
          );
          retryCountRef.current = 0; // 성공 시 재시도 카운트 리셋
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[useNewsFeed] ❌ CHANNEL_ERROR:`, err || "Unknown error");
          
          // Exponential backoff으로 재연결
          if (retryCountRef.current < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
            retryCountRef.current++;
            console.log(
              `[useNewsFeed] 🔄 Retrying connection in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})...`
            );
            
            setTimeout(() => {
              if (isSubscribed) {
                setupRealtime(userId);
              }
            }, delay);
          } else {
            console.error(
              `[useNewsFeed] ❌ Max retries (${maxRetries}) reached. Giving up.`
            );
          }
        } else if (status === "TIMED_OUT") {
          console.error(`[useNewsFeed] ⏱️ TIMED_OUT:`, err || "Connection timeout");
          
          // Timeout 시에도 재시도
          if (retryCountRef.current < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
            retryCountRef.current++;
            console.log(
              `[useNewsFeed] 🔄 Retrying after timeout in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})...`
            );
            
            setTimeout(() => {
              if (isSubscribed) {
                setupRealtime(userId);
              }
            }, delay);
          } else {
            console.error(
              `[useNewsFeed] ❌ Max retries (${maxRetries}) reached after timeout. Giving up.`
            );
          }
        } else if (status === "CLOSED") {
          console.log(`[useNewsFeed] 🔒 Channel closed`);
        }
      });

      channelRef.current = channel;
    };

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || null;
      await setupRealtime(userId);
      if (isSubscribed) {
        setIsAuthReady(true);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        `[useNewsFeed] 👤 Auth changed: ${event}`,
        session?.user?.id || "anon"
      );

      const newUserId = session?.user?.id || null;
      const currentUserId = lastSubscribedUserIdRef.current;

      if (newUserId === currentUserId) {
        console.log(`[useNewsFeed] ⏸️ Same user, ignoring event: ${event}`);
        return;
      }

      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }

      setupTimeoutRef.current = setTimeout(() => {
        if (!isSubscribed) return;
        console.log(`[useNewsFeed] 🔄 User changed, re-subscribing...`);
        retryCountRef.current = 0; // 사용자 변경 시 재시도 카운트 리셋
        setupRealtime(newUserId);
      }, 300);
    });

    return () => {
      isSubscribed = false;
      subscription?.unsubscribe();

      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }

      if (channelRef.current) {
        console.log(`[useNewsFeed] 🧹 Cleanup: removing channel`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      lastSubscribedUserIdRef.current = null;
      retryCountRef.current = 0;
    };
  }, [supabase, refreshFeed]);

  useEffect(() => {
    if (
      isAuthReady &&
      !initialLoadDoneRef.current &&
      !isLoading &&
      !isLoadingMore
    ) {
      console.log("[useNewsFeed] 🚀 Triggering initial load");
      fetchNews(sortBy, 0, true);
    }
  }, [isAuthReady, sortBy, fetchNews, isLoading, isLoadingMore]);

  const loadMoreTriggerRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          console.log("[useNewsFeed] 🔄 Loading more...");
          fetchNews(sortBy, page + 1, false);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMore, hasNextPage, fetchNews, sortBy, page]
  );

  const handleSortChange = useCallback(
    (key: SortKey) => {
      if (key === sortBy) return;
      console.log(`[useNewsFeed] 🔄 Sort changed to: ${key}`);
      setSortBy(key);
      setNewsList([]);
      setPage(0);
      setHasNextPage(true);
      initialLoadDoneRef.current = false;
    },
    [sortBy]
  );

  const handleLikeToggle = useCallback(
    async (id: string) => {
      console.log(`[useNewsFeed] 💛 handleLikeToggle for ID: ${id}`);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const currentItem = newsList.find((item) => item.id === id);
      if (!currentItem) return;

      const isCurrentlyLiked = currentItem.isLiked;
      const currentLikes = currentItem.like_count ?? 0;

      setNewsList((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              isLiked: !isCurrentlyLiked,
              like_count: !isCurrentlyLiked
                ? currentLikes + 1
                : Math.max(0, currentLikes - 1),
            };
          }
          return item;
        })
      );

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

          if (error && error.code !== "23505") {
            throw error;
          } else if (error?.code === "23505") {
            console.log("[useNewsFeed] ℹ️ Like already exists, ignoring...");
            setNewsList((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, isLiked: true } : item
              )
            );
          }
        }
      } catch (err) {
        console.error("[LikeToggle Error]", err);
        setMessage("❌ 좋아요 처리에 실패했습니다.");
        setNewsList((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                isLiked: isCurrentlyLiked,
                like_count: currentLikes,
              };
            }
            return item;
          })
        );
      }
    },
    [newsList, supabase]
  );

  const handleBookmarkToggle = useCallback(
    async (id: string) => {
      console.log(`[useNewsFeed] 📖 handleBookmarkToggle for ID: ${id}`);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const currentItem = newsList.find((item) => item.id === id);
      if (!currentItem) return;

      const isCurrentlyBookmarked = currentItem.isBookmarked;

      setNewsList((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              isBookmarked: !isCurrentlyBookmarked,
            };
          }
          return item;
        })
      );

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

          if (error && error.code !== "23505") {
            throw error;
          } else if (error?.code === "23505") {
            console.log(
              "[useNewsFeed] ℹ️ Bookmark already exists, ignoring..."
            );
            setNewsList((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, isBookmarked: true } : item
              )
            );
          }
        }
      } catch (err) {
        console.error("[BookmarkToggle Error]", err);
        setMessage("❌ 북마크 처리에 실패했습니다.");
        setNewsList((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                isBookmarked: isCurrentlyBookmarked,
              };
            }
            return item;
          })
        );
      }
    },
    [newsList, supabase]
  );

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