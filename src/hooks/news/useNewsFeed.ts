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
  console.log(`[useNewsFeed] ✅ REALTIME [news ${payload.eventType}]:`, payload.new || payload.old);
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
  console.log(`[useNewsFeed] ✅ REALTIME [user_news_likes ${payload.eventType}]:`, payload.new || payload.old);
  
  const actionUserId = payload.eventType === "INSERT" ? payload.new.user_id : payload.old.user_id;
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
  console.log(`[useNewsFeed] ✅ REALTIME [user_news_bookmarks ${payload.eventType}]:`, payload.new || payload.old);
  
  const actionUserId = payload.eventType === "INSERT" ? payload.new.user_id : payload.old.user_id;
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
        item.id === oldBookmark.news_id ? { ...item, isBookmarked: false } : item
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
  const initialLoadDoneRef = useRef(false); // ✅ 초기 로드 완료 플래그

  // ✅ FIX: fetchNews에 supabase 의존성 추가
  const fetchNews = useCallback(
    async (
      currentSortBy: SortKey,
      pageToFetch: number,
      isInitialLoad = false
    ) => {
      console.log(`[useNewsFeed] 📥 fetchNews called - page: ${pageToFetch}, initial: ${isInitialLoad}`);
      
      if (isInitialLoad) setIsLoading(true);
      else setIsLoadingMore(true);

      setMessage("");

      try {
        const userId = userIdRef.current;
        const from = pageToFetch * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        console.log(`[useNewsFeed] 🔍 Fetching from ${from} to ${to} for user: ${userId || "anon"}`);

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
          initialLoadDoneRef.current = true; // ✅ 초기 로드 완료 표시
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
    [supabase] // ✅ supabase 의존성 추가
  );

  const refreshFeed = useCallback(() => {
    console.log("[useNewsFeed] 🔄 Refreshing feed");
    setNewsList([]);
    setPage(0);
    setHasNextPage(true);
    initialLoadDoneRef.current = false; // ✅ 초기 로드 플래그 리셋
    // ✅ fetchNews를 직접 호출하여 데이터를 다시 로드
    fetchNews(sortBy, 0, true);
  }, [fetchNews, sortBy]);

  // ✅ FIX: Realtime 구독 설정
  useEffect(() => {
    let isSubscribed = true;

    const setupRealtime = async (userId: string | null) => {
      if (lastSubscribedUserIdRef.current === userId) {
        console.log(`[useNewsFeed] ⏸️ Already subscribed for user: ${userId || "anon"}, skipping...`);
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

      const channelName = `news-feed:${userId || "anon"}:${Date.now()}`;
      const channel = supabase.channel(channelName);
      console.log(`[useNewsFeed] 🚀 Subscribing to: ${channelName}`);

      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "news" },
        (payload) => handleNewsUpdate(
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
            (payload) => handleLikeUpdate(
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
            (payload) => handleBookmarkUpdate(
              payload as RealtimePostgresChangesPayload<BookmarkPayload>,
              setNewsList,
              userId
            )
          );
      }

      channel.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`[useNewsFeed] ✅ SUBSCRIBED successfully for user: ${userId || "anon"}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[useNewsFeed] ❌ CHANNEL_ERROR:`, err);
        } else if (status === "TIMED_OUT") {
          console.error(`[useNewsFeed] ⏱️ TIMED_OUT`);
        }
      });

      channelRef.current = channel;
    };

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      await setupRealtime(userId);
      if (isSubscribed) {
        setIsAuthReady(true); // ✅ 사용자 ID 확인 후 인증 준비 완료 신호
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[useNewsFeed] 👤 Auth changed: ${event}`, session?.user?.id || "anon");
      
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
    };
  }, [supabase, refreshFeed]);

  // ✅ FIX: 초기 데이터 로드 - 조건 단순화
  useEffect(() => {
    // 초기 로드가 아직 안 됐고, 로딩 중이 아닐 때만 실행
    if (isAuthReady && !initialLoadDoneRef.current && !isLoading && !isLoadingMore) {
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
          console.log("[useNewsFeed] 📄 Loading more...");
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
      initialLoadDoneRef.current = false; // ✅ 초기 로드 플래그 리셋
    },
    [sortBy]
  );

  const handleLikeToggle = useCallback(
    async (id: string) => {
      console.log(`[useNewsFeed] 💛 handleLikeToggle for ID: ${id}`);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const currentItem = newsList.find(item => item.id === id);
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
      console.log(`[useNewsFeed] 🔖 handleBookmarkToggle for ID: ${id}`);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const currentItem = newsList.find(item => item.id === id);
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
            console.log("[useNewsFeed] ℹ️ Bookmark already exists, ignoring...");
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

// "use client";

// import {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
//   useMemo,
//   Dispatch,
//   SetStateAction,
// } from "react";
// import { createClient } from "@/utils/supabase/client";
// import { SortKey, NewsItemWithState, NewsRow } from "@/types";
// import {
//   RealtimeChannel,
//   RealtimePostgresChangesPayload,
// } from "@supabase/supabase-js";

// export const PAGE_SIZE = 10;

// type SupabaseNewsItem = Omit<NewsItemWithState, "isLiked" | "isBookmarked"> & {
//   user_news_likes: { user_id: string }[] | null;
//   user_news_bookmarks: { user_id: string }[] | null;
// };

// // 헬퍼 함수들
// const handleNewsUpdate = (
//   payload: RealtimePostgresChangesPayload<NewsRow>,
//   setNewsList: Dispatch<SetStateAction<NewsItemWithState[]>>
// ) => {
//   console.log(`[useNewsFeed] ✅ REALTIME [news ${payload.eventType}]:`, payload.new || payload.old);
//   if (payload.eventType === "UPDATE") {
//     const updatedNews = payload.new;
//     setNewsList((prev) => {
//       console.log(`[useNewsFeed] 🔄 Updating news item ID: ${updatedNews.id}`);
//       return prev.map((item) =>
//         item.id === updatedNews.id
//           ? {
//               ...item,
//               like_count: updatedNews.like_count,
//               view_count: updatedNews.view_count,
//               title: updatedNews.title,
//               tags: updatedNews.tags,
//             }
//           : item
//       );
//     });
//   }
// };

// type LikePayload = { news_id: string; user_id: string };
// const handleLikeUpdate = (
//   payload: RealtimePostgresChangesPayload<LikePayload>,
//   setNewsList: Dispatch<SetStateAction<NewsItemWithState[]>>,
//   currentUserId: string | null
// ) => {
//   console.log(`[useNewsFeed] ✅ REALTIME [user_news_likes ${payload.eventType}]:`, payload.new || payload.old);
  
//   const actionUserId = payload.eventType === "INSERT" ? payload.new.user_id : payload.old.user_id;
//   if (actionUserId !== currentUserId) return;

//   if (payload.eventType === "INSERT") {
//     const newLike = payload.new;
//     setNewsList((prev) =>
//       prev.map((item) =>
//         item.id === newLike.news_id ? { ...item, isLiked: true } : item
//       )
//     );
//   } else if (payload.eventType === "DELETE") {
//     const oldLike = payload.old;
//     setNewsList((prev) =>
//       prev.map((item) =>
//         item.id === oldLike.news_id ? { ...item, isLiked: false } : item
//       )
//     );
//   }
// };

// type BookmarkPayload = { news_id: string; user_id: string };
// const handleBookmarkUpdate = (
//   payload: RealtimePostgresChangesPayload<BookmarkPayload>,
//   setNewsList: Dispatch<SetStateAction<NewsItemWithState[]>>,
//   currentUserId: string | null
// ) => {
//   console.log(`[useNewsFeed] ✅ REALTIME [user_news_bookmarks ${payload.eventType}]:`, payload.new || payload.old);
  
//   const actionUserId = payload.eventType === "INSERT" ? payload.new.user_id : payload.old.user_id;
//   if (actionUserId !== currentUserId) return;

//   if (payload.eventType === "INSERT") {
//     const newBookmark = payload.new;
//     setNewsList((prev) =>
//       prev.map((item) =>
//         item.id === newBookmark.news_id ? { ...item, isBookmarked: true } : item
//       )
//     );
//   } else if (payload.eventType === "DELETE") {
//     const oldBookmark = payload.old;
//     setNewsList((prev) =>
//       prev.map((item) =>
//         item.id === oldBookmark.news_id ? { ...item, isBookmarked: false } : item
//       )
//     );
//   }
// };

// export function useNewsFeed(initialSortBy: SortKey = "published_at") {
//   const [supabase] = useState(() => createClient());

//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [newsList, setNewsList] = useState<NewsItemWithState[]>([]);
//   const [sortBy, setSortBy] = useState<SortKey>(initialSortBy);
//   const [page, setPage] = useState(0);
//   const [hasNextPage, setHasNextPage] = useState(true);
//   const [message, setMessage] = useState("");

//   const observerRef = useRef<IntersectionObserver | null>(null);
//   const channelRef = useRef<RealtimeChannel | null>(null);
//   const userIdRef = useRef<string | null>(null);
//   const lastSubscribedUserIdRef = useRef<string | null>(null); // ✅ 마지막 구독 유저 ID 추적
//   const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ debounce용 타이머

//   // ✅ FIX: Realtime 구독 - userId 기반 중복 방지 + debounce
//   useEffect(() => {
//     let isSubscribed = true;

//     const setupRealtime = async (userId: string | null) => {
//       // ✅ 같은 유저로 이미 구독 중이면 무시
//       if (lastSubscribedUserIdRef.current === userId) {
//         console.log(`[useNewsFeed] ⏸️ Already subscribed for user: ${userId || "anon"}, skipping...`);
//         return;
//       }

//       // 기존 채널 정리
//       if (channelRef.current) {
//         console.log(`[useNewsFeed] 🧹 Removing old channel`);
//         await supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }

//       if (!isSubscribed) return;

//       // ✅ 현재 구독 중인 유저 기록
//       lastSubscribedUserIdRef.current = userId;
//       userIdRef.current = userId;

//       const channelName = `news-feed:${userId || "anon"}:${Date.now()}`;
//       const channel = supabase.channel(channelName);
//       console.log(`[useNewsFeed] 🚀 Subscribing to: ${channelName}`);

//       // news 테이블 구독
//       channel.on(
//         "postgres_changes",
//         { event: "UPDATE", schema: "public", table: "news" },
//         (payload) => handleNewsUpdate(
//           payload as RealtimePostgresChangesPayload<NewsRow>,
//           setNewsList
//         )
//       );

//       // 로그인한 사용자만 like/bookmark 구독
//       if (userId) {
//         channel
//           .on(
//             "postgres_changes",
//             {
//               event: "*",
//               schema: "public",
//               table: "user_news_likes",
//               filter: `user_id=eq.${userId}`,
//             },
//             (payload) => handleLikeUpdate(
//               payload as RealtimePostgresChangesPayload<LikePayload>,
//               setNewsList,
//               userId
//             )
//           )
//           .on(
//             "postgres_changes",
//             {
//               event: "*",
//               schema: "public",
//               table: "user_news_bookmarks",
//               filter: `user_id=eq.${userId}`,
//             },
//             (payload) => handleBookmarkUpdate(
//               payload as RealtimePostgresChangesPayload<BookmarkPayload>,
//               setNewsList,
//               userId
//             )
//           );
//       }

//       // 구독 실행
//       channel.subscribe((status, err) => {
//         if (status === "SUBSCRIBED") {
//           console.log(`[useNewsFeed] ✅ SUBSCRIBED successfully for user: ${userId || "anon"}`);
//         } else if (status === "CHANNEL_ERROR") {
//           console.error(`[useNewsFeed] ❌ CHANNEL_ERROR:`, err);
//         } else if (status === "TIMED_OUT") {
//           console.error(`[useNewsFeed] ⏱️ TIMED_OUT`);
//         }
//       });

//       channelRef.current = channel;
//     };

//     // ✅ 초기 구독 (즉시 실행)
//     (async () => {
//       const { data: { user } } = await supabase.auth.getUser();
//       const userId = user?.id || null;
//       await setupRealtime(userId);
//     })();

//     // ✅ Auth 상태 변경 감지 (debounce 적용)
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//       console.log(`[useNewsFeed] 👤 Auth changed: ${event}`, session?.user?.id || "anon");
      
//       // ✅ 유저 변경 감지 (로그인/로그아웃 시에만)
//       const newUserId = session?.user?.id || null;
//       const currentUserId = lastSubscribedUserIdRef.current;

//       // 같은 유저면 무시
//       if (newUserId === currentUserId) {
//         console.log(`[useNewsFeed] ⏸️ Same user, ignoring event: ${event}`);
//         return;
//       }

//       // ✅ debounce: 300ms 내에 추가 이벤트 오면 이전 타이머 취소
//       if (setupTimeoutRef.current) {
//         clearTimeout(setupTimeoutRef.current);
//       }

//       setupTimeoutRef.current = setTimeout(() => {
//         if (!isSubscribed) return;
//         console.log(`[useNewsFeed] 🔄 User changed, re-subscribing...`);
//         setupRealtime(newUserId);
//       }, 300);
//     });

//     return () => {
//       isSubscribed = false;
//       subscription?.unsubscribe();
      
//       if (setupTimeoutRef.current) {
//         clearTimeout(setupTimeoutRef.current);
//       }

//       if (channelRef.current) {
//         console.log(`[useNewsFeed] 🧹 Cleanup: removing channel`);
//         supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }
      
//       lastSubscribedUserIdRef.current = null;
//     };
//   }, []); // ✅ 빈 배열 - mount 시 1번만 실행

//   const fetchNews = useCallback(
//     async (
//       currentSortBy: SortKey,
//       pageToFetch: number,
//       isInitialLoad = false
//     ) => {
//       if (isInitialLoad) setIsLoading(true);
//       else setIsLoadingMore(true);

//       setMessage("");

//       const userId = userIdRef.current;
//       const from = pageToFetch * PAGE_SIZE;
//       const to = from + PAGE_SIZE - 1;

//       let query = supabase
//         .from("news")
//         .select(
//           `
//           id, title, site_name, created_at, published_at, images, like_count, view_count, tags,
//           user_news_likes!left(user_id),
//           user_news_bookmarks!left(user_id)
//         `
//         )
//         .filter(
//           "user_news_likes.user_id",
//           "eq",
//           userId || "00000000-0000-0000-0000-000000000000"
//         )
//         .filter(
//           "user_news_bookmarks.user_id",
//           "eq",
//           userId || "00000000-0000-0000-0000-000000000000"
//         )
//         .range(from, to);

//       if (currentSortBy === "published_at") {
//         query = query
//           .order("published_at", { ascending: false, nullsFirst: false })
//           .order("created_at", { ascending: false });
//       } else if (currentSortBy === "like_count") {
//         query = query
//           .order("like_count", { ascending: false, nullsFirst: true })
//           .order("view_count", { ascending: false, nullsFirst: true })
//           .order("created_at", { ascending: false });
//       }

//       const { data, error } = await query;

//       if (!error && data) {
//         const typedData = data as SupabaseNewsItem[];

//         const dataWithState: NewsItemWithState[] = typedData.map((item) => ({
//           ...item,
//           isLiked: !!(item.user_news_likes && item.user_news_likes.length > 0),
//           isBookmarked: !!(
//             item.user_news_bookmarks && item.user_news_bookmarks.length > 0
//           ),
//           user_news_likes: undefined,
//           user_news_bookmarks: undefined,
//         }));

//         if (isInitialLoad) {
//           setNewsList(dataWithState);
//         } else {
//           setNewsList((prev) => [...prev, ...dataWithState]);
//         }

//         setPage(pageToFetch);
//         setHasNextPage(data.length === PAGE_SIZE);
//       } else {
//         console.error("Supabase fetch error:", error);
//         setMessage("❌ 목록을 불러오는 중 오류가 발생했습니다.");
//       }

//       if (isInitialLoad) setIsLoading(false);
//       else setIsLoadingMore(false);
//     },
//     []
//   );

//   useEffect(() => {
//     if (newsList.length === 0 && hasNextPage && !isLoading && !isLoadingMore) {
//       fetchNews(sortBy, 0, true);
//     }
//   }, [sortBy, fetchNews, newsList.length, isLoading, isLoadingMore, hasNextPage]);

//   const loadMoreTriggerRef = useCallback(
//     (node: HTMLDivElement) => {
//       if (isLoading || isLoadingMore) return;
//       if (observerRef.current) observerRef.current.disconnect();

//       observerRef.current = new IntersectionObserver((entries) => {
//         if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
//           fetchNews(sortBy, page + 1, false);
//         }
//       });

//       if (node) observerRef.current.observe(node);
//     },
//     [isLoading, isLoadingMore, hasNextPage, fetchNews, sortBy, page]
//   );

//   const handleSortChange = useCallback(
//     (key: SortKey) => {
//       if (key === sortBy) return;
//       setSortBy(key);
//       setNewsList([]);
//       setPage(0);
//       setHasNextPage(true);
//     },
//     [sortBy]
//   );

//   const handleLikeToggle = useCallback(
//     async (id: string) => {
//       console.log(`[useNewsFeed] 💛 handleLikeToggle for ID: ${id}`);
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) {
//         alert("로그인이 필요합니다.");
//         return;
//       }

//       const currentItem = newsList.find(item => item.id === id);
//       if (!currentItem) return;

//       const isCurrentlyLiked = currentItem.isLiked;
//       const currentLikes = currentItem.like_count ?? 0;

//       // 낙관적 업데이트
//       setNewsList((prev) =>
//         prev.map((item) => {
//           if (item.id === id) {
//             return {
//               ...item,
//               isLiked: !isCurrentlyLiked,
//               like_count: !isCurrentlyLiked
//                 ? currentLikes + 1
//                 : Math.max(0, currentLikes - 1),
//             };
//           }
//           return item;
//         })
//       );

//       try {
//         if (isCurrentlyLiked) {
//           const { error } = await supabase
//             .from("user_news_likes")
//             .delete()
//             .eq("user_id", user.id)
//             .eq("news_id", id);
//           if (error) throw error;
//         } else {
//           const { error } = await supabase
//             .from("user_news_likes")
//             .insert({ user_id: user.id, news_id: id });
          
//           if (error && error.code !== "23505") {
//             throw error;
//           } else if (error?.code === "23505") {
//             console.log("[useNewsFeed] ℹ️ Like already exists, ignoring...");
//             setNewsList((prev) =>
//               prev.map((item) =>
//                 item.id === id ? { ...item, isLiked: true } : item
//               )
//             );
//           }
//         }
//       } catch (err) {
//         console.error("[LikeToggle Error]", err);
//         setMessage("❌ 좋아요 처리에 실패했습니다.");
//         // 롤백
//         setNewsList((prev) =>
//           prev.map((item) => {
//             if (item.id === id) {
//               return {
//                 ...item,
//                 isLiked: isCurrentlyLiked,
//                 like_count: currentLikes,
//               };
//             }
//             return item;
//           })
//         );
//       }
//     },
//     [newsList]
//   );

//   const handleBookmarkToggle = useCallback(
//     async (id: string) => {
//       console.log(`[useNewsFeed] 🔖 handleBookmarkToggle for ID: ${id}`);
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) {
//         alert("로그인이 필요합니다.");
//         return;
//       }

//       const currentItem = newsList.find(item => item.id === id);
//       if (!currentItem) return;

//       const isCurrentlyBookmarked = currentItem.isBookmarked;

//       // 낙관적 업데이트
//       setNewsList((prev) =>
//         prev.map((item) => {
//           if (item.id === id) {
//             return {
//               ...item,
//               isBookmarked: !isCurrentlyBookmarked,
//             };
//           }
//           return item;
//         })
//       );

//       try {
//         if (isCurrentlyBookmarked) {
//           const { error } = await supabase
//             .from("user_news_bookmarks")
//             .delete()
//             .eq("user_id", user.id)
//             .eq("news_id", id);
//           if (error) throw error;
//         } else {
//           const { error } = await supabase
//             .from("user_news_bookmarks")
//             .insert({ user_id: user.id, news_id: id });
          
//           if (error && error.code !== "23505") {
//             throw error;
//           } else if (error?.code === "23505") {
//             console.log("[useNewsFeed] ℹ️ Bookmark already exists, ignoring...");
//             setNewsList((prev) =>
//               prev.map((item) =>
//                 item.id === id ? { ...item, isBookmarked: true } : item
//               )
//             );
//           }
//         }
//       } catch (err) {
//         console.error("[BookmarkToggle Error]", err);
//         setMessage("❌ 북마크 처리에 실패했습니다.");
//         // 롤백
//         setNewsList((prev) =>
//           prev.map((item) => {
//             if (item.id === id) {
//               return {
//                 ...item,
//                 isBookmarked: isCurrentlyBookmarked,
//               };
//             }
//             return item;
//           })
//         );
//       }
//     },
//     [newsList]
//   );

//   const refreshFeed = useCallback(() => {
//     setNewsList([]);
//     setPage(0);
//     setHasNextPage(true);
//   }, []);

//   const latestNews = useMemo(() => {
//     return [...newsList]
//       .sort((a, b) => {
//         const dateA = new Date(a.published_at || a.created_at).getTime();
//         const dateB = new Date(b.published_at || b.created_at).getTime();
//         if (isNaN(dateA)) return 1;
//         if (isNaN(dateB)) return -1;
//         return dateB - dateA;
//       })
//       .slice(0, 10);
//   }, [newsList]);

//   return {
//     isLoading,
//     isLoadingMore,
//     newsList,
//     message,
//     setMessage,
//     hasNextPage,
//     sortBy,
//     handleSortChange,
//     handleLikeToggle,
//     handleBookmarkToggle,
//     loadMoreTriggerRef,
//     refreshFeed,
//     latestNews,
//   };
// }

// "use client";

// import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { createClient } from "@/utils/supabase/client";
// import { SortKey, NewsItemWithState } from "@/types";

// export const PAGE_SIZE = 10;

// // [수정] 1. Supabase JOIN 결과를 위한 타입 정의 (any[] 대체)
// type SupabaseNewsItem = Omit<NewsItemWithState, "isLiked" | "isBookmarked"> & {
//   user_news_likes: { user_id: string }[] | null;
//   user_news_bookmarks: { user_id: string }[] | null;
// };

// export function useNewsFeed(initialSortBy: SortKey = "published_at") {
//   const supabase = createClient();

//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [newsList, setNewsList] = useState<NewsItemWithState[]>([]);
//   const [sortBy, setSortBy] = useState<SortKey>(initialSortBy);
//   const [page, setPage] = useState(0);
//   const [hasNextPage, setHasNextPage] = useState(true);
//   const [message, setMessage] = useState("");

//   const observerRef = useRef<IntersectionObserver | null>(null);

//   const fetchNews = useCallback(
//     async (
//       currentSortBy: SortKey,
//       pageToFetch: number,
//       isInitialLoad = false
//     ) => {
//       await Promise.resolve();

//       if (isInitialLoad) setIsLoading(true);
//       else setIsLoadingMore(true);

//       setMessage("");

//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       const userId = user?.id;

//       const from = pageToFetch * PAGE_SIZE;
//       const to = from + PAGE_SIZE - 1;

//       let query = supabase
//         .from("news")
//         .select(
//           `
//           id, title, site_name, created_at, published_at, images, like_count, view_count, tags,
//           user_news_likes!left(user_id),
//           user_news_bookmarks!left(user_id)
//         `
//         )
//         .filter(
//           "user_news_likes.user_id",
//           "eq",
//           userId || "00000000-0000-0000-0000-000000000000"
//         )
//         .filter(
//           "user_news_bookmarks.user_id",
//           "eq",
//           userId || "00000000-0000-0000-0000-000000000000"
//         )
//         .range(from, to);

//       if (currentSortBy === "published_at") {
//         query = query
//           .order("published_at", { ascending: false, nullsFirst: false })
//           .order("created_at", { ascending: false });
//       } else if (currentSortBy === "like_count") {
//         query = query
//           .order("like_count", { ascending: false, nullsFirst: true })
//           .order("view_count", { ascending: false, nullsFirst: true })
//           .order("created_at", { ascending: false });
//       }

//       const { data, error } = await query;

//       if (!error && data) {
//         // [수정] 2. (data as any[]) 대신 정의한 타입 사용
//         const typedData = data as SupabaseNewsItem[];

//         const dataWithState: NewsItemWithState[] = typedData.map((item) => ({
//           ...item,
//           isLiked: !!(item.user_news_likes && item.user_news_likes.length > 0),
//           isBookmarked: !!(
//             item.user_news_bookmarks && item.user_news_bookmarks.length > 0
//           ),
//           user_news_likes: undefined,
//           user_news_bookmarks: undefined,
//         }));

//         if (isInitialLoad) {
//           setNewsList(dataWithState);
//         } else {
//           setNewsList((prev) => [...prev, ...dataWithState]);
//         }

//         setPage(pageToFetch);
//         setHasNextPage(data.length === PAGE_SIZE);
//       } else {
//         console.error(
//           "Supabase fetch error:",
//           error?.message || JSON.stringify(error)
//         );
//         setMessage("❌ 목록을 불러오는 중 오류가 발생했습니다.");
//       }

//       if (isInitialLoad) setIsLoading(false);
//       else setIsLoadingMore(false);
//     },
//     [supabase] // [수정] 3. supabase 의존성 추가 (setter 함수들은 안정적이라 필요 X)
//   );

//   // 정렬 변경 또는 목록 초기화 시 데이터 로드
//   useEffect(() => {
//     if (newsList.length === 0 && hasNextPage && !isLoading && !isLoadingMore) {
//       fetchNews(sortBy, 0, true);
//     }
//   }, [
//     sortBy,
//     fetchNews,
//     newsList.length,
//     isLoading,
//     isLoadingMore,
//     hasNextPage,
//   ]);

//   // 무한 스크롤 옵저버
//   const loadMoreTriggerRef = useCallback(
//     (node: HTMLDivElement) => {
//       if (isLoading || isLoadingMore) return;
//       if (observerRef.current) observerRef.current.disconnect();

//       observerRef.current = new IntersectionObserver((entries) => {
//         if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
//           fetchNews(sortBy, page + 1, false);
//         }
//       });

//       if (node) observerRef.current.observe(node);
//     },
//     [isLoading, isLoadingMore, hasNextPage, fetchNews, sortBy, page]
//   );

//   // 정렬 변경 핸들러
//   // [수정] 4. useCallback 래핑
//   const handleSortChange = useCallback(
//     (key: SortKey) => {
//       if (key === sortBy) return;
//       setSortBy(key);
//       setNewsList([]);
//       setPage(0);
//       setHasNextPage(true);
//     },
//     [sortBy] // sortBy만 의존 (setter는 안정적)
//   );

//   // 좋아요 토글
//   // [수정] 4. useCallback 래핑
//   const handleLikeToggle = useCallback(
//     async (id: string) => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       if (!user) {
//         alert("로그인이 필요합니다.");
//         return;
//       }

//       let originalList: NewsItemWithState[] = [];
//       let isCurrentlyLiked = false;

//       setNewsList((prev) => {
//         originalList = prev;
//         return prev.map((item) => {
//           if (item.id === id) {
//             isCurrentlyLiked = item.isLiked;
//             return {
//               ...item,
//               isLiked: !item.isLiked,
//               like_count: !item.isLiked
//                 ? (item.like_count ?? 0) + 1
//                 : Math.max(0, (item.like_count ?? 0) - 1),
//             };
//           }
//           return item;
//         });
//       });

//       try {
//         if (isCurrentlyLiked) {
//           const { error } = await supabase
//             .from("user_news_likes")
//             .delete()
//             .eq("user_id", user.id)
//             .eq("news_id", id);
//           if (error) throw error;
//         } else {
//           const { error } = await supabase
//             .from("user_news_likes")
//             .insert({ user_id: user.id, news_id: id });
//           if (error) throw error;
//         }
//       } catch (err: unknown) {
//         // [수정] 4. any -> unknown 및 타입 가드
//         console.error(
//           "[LikeToggle Error]",
//           err instanceof Error ? err.message : JSON.stringify(err)
//         );
//         setMessage("❌ 좋아요 처리에 실패했습니다.");
//         setNewsList(originalList);
//       }
//     },
//     [supabase] // supabase 의존성 추가 (setter는 안정적)
//   );

//   // 북마크 토글
//   // [수정] 4. useCallback 래핑
//   const handleBookmarkToggle = useCallback(
//     async (id: string) => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       if (!user) {
//         alert("로그인이 필요합니다.");
//         return;
//       }

//       let originalList: NewsItemWithState[] = [];
//       let isCurrentlyBookmarked = false;

//       setNewsList((prev) => {
//         originalList = prev;
//         return prev.map((item) => {
//           if (item.id === id) {
//             isCurrentlyBookmarked = item.isBookmarked;
//             return {
//               ...item,
//               isBookmarked: !item.isBookmarked,
//             };
//           }
//           return item;
//         });
//       });

//       try {
//         if (isCurrentlyBookmarked) {
//           const { error } = await supabase
//             .from("user_news_bookmarks")
//             .delete()
//             .eq("user_id", user.id)
//             .eq("news_id", id);
//           if (error) throw error;
//         } else {
//           const { error } = await supabase
//             .from("user_news_bookmarks")
//             .insert({ user_id: user.id, news_id: id });
//           if (error) throw error;
//         }
//       } catch (err: unknown) {
//         // [수정] 4. any -> unknown 및 타입 가드
//         console.error(
//           "[BookmarkToggle Error]",
//           err instanceof Error ? err.message : JSON.stringify(err)
//         );
//         setMessage("❌ 북마크 처리에 실패했습니다.");
//         setNewsList(originalList);
//       }
//     },
//     [supabase] // supabase 의존성 추가 (setter는 안정적)
//   );

//   // 피드 강제 새로고침
//   // [수정] 4. useCallback 래핑
//   const refreshFeed = useCallback(() => {
//     setNewsList([]);
//     setPage(0);
//     setHasNextPage(true);
//   }, []); // setter 함수들만 사용하므로 의존성 없음

//   // 최신 뉴스 계산
//   const latestNews = useMemo(() => {
//     return [...newsList]
//       .sort((a, b) => {
//         const dateA = new Date(a.published_at || a.created_at).getTime();
//         const dateB = new Date(b.published_at || b.created_at).getTime();
//         if (isNaN(dateA)) return 1;
//         if (isNaN(dateB)) return -1;
//         return dateB - dateA;
//       })
//       .slice(0, 10);
//   }, [newsList]);

//   return {
//     isLoading,
//     isLoadingMore,
//     newsList,
//     message,
//     setMessage,
//     hasNextPage,
//     sortBy,
//     handleSortChange,
//     handleLikeToggle,
//     handleBookmarkToggle,
//     loadMoreTriggerRef,
//     refreshFeed,
//     latestNews,
//   };
// }
