"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Heart, Eye, Bookmark } from "lucide-react";
// ✅ 1. NewsFeedContext 임포트
import { useNewsFeedContext } from "@/context/NewsFeedContext";

type DetailActionsProps = {
  id: string;
  initialLikes: number;
  initialViews: number;
  initialIsLiked: boolean;
  initialIsBookmarked: boolean;
};

export default function DetailActions({
  id,
  initialLikes,
  initialViews,
  initialIsLiked,
  initialIsBookmarked,
}: DetailActionsProps) {
  const [supabase] = useState(() => createClient());

  // ✅ 2. Context에서 상태와 핸들러 가져오기
  const { newsList, handleLikeToggle, handleBookmarkToggle } =
    useNewsFeedContext();

  // ✅ 3. Context의 newsList에서 현재 아이템 상태 찾기
  //    (찾지 못하면 서버에서 받은 initial 값으로 대체)
  const item = newsList.find((n) => n.id === id);
  const likes = item?.like_count ?? initialLikes;
  const isLiked = item?.isLiked ?? initialIsLiked;
  const isBookmarked = item?.isBookmarked ?? initialIsBookmarked;

  // ✅ 4. 조회수(views)는 이 페이지에서만 관리하므로 local state 유지
  const [views, setViews] = useState(initialViews);
  const viewIncrementedRef = useRef(false);

  // ✅ 5. DetailActions의 모든 채널 생성, 구독, 인증 로직 (useEffect) 제거
  //    (약 110라인부터 244라인까지의 useEffect 블록 전체 삭제)
  //    (verifyState 함수도 삭제)

  // ✅ 6. 조회수 증가 로직은 유지 (이 페이지 고유 기능)
  useEffect(() => {
    let mounted = true;
    const incView = async () => {
      try {
        if (viewIncrementedRef.current) return;
        console.log(`[DetailActions] 👁️ Incrementing view for ID: ${id}`);
        viewIncrementedRef.current = true;
        setViews((v) => v + 1); // 낙관적 업데이트

        const { error } = await supabase.rpc("news_increment_view", { p_id: id });
        if (error && mounted) {
          setViews((v) => Math.max(0, v - 1)); // 롤백
          viewIncrementedRef.current = false;
        }
      } catch (err) {
        if (mounted) {
          setViews((v) => Math.max(0, v - 1));
          viewIncrementedRef.current = false;
        }
      }
    };
    const timer = setTimeout(incView, 1000);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [id, supabase]);

  // ✅ 7. Context의 핸들러 사용 (로컬 핸들러 삭제)
  const onLikeClick = useCallback(() => {
    handleLikeToggle(id);
  }, [handleLikeToggle, id]);

  const onBookmarkClick = useCallback(() => {
    handleBookmarkToggle(id);
  }, [handleBookmarkToggle, id]);

  return (
    <div className="flex justify-center gap-30 text-[#717182] py-6">
      <button
        onClick={onLikeClick} // ✅ 7.1
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          isLiked // ✅ 3.1
            ? "text-[#FF569B] bg-[#F7E6ED]"
            : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
        }`}
        aria-pressed={isLiked} // ✅ 3.2
        aria-label="좋아요"
      >
        <div className="flex gap-2 text-sm items-center ">
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          <span className="font-semibold">{likes}</span> 
        </div>
      </button>

      <span className="cursor-pointer py-1 px-2 rounded-md" aria-label="조회수">
        <div className="flex gap-2 text-sm items-center">
          <Eye size={18} />
          <span className="font-semibold">{views}</span> 
        </div>
      </span>

      <button
        onClick={onBookmarkClick} // ✅ 7.2
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          isBookmarked // ✅ 3.3
            ? "text-[#6758FF] bg-[#D8D4FF]"
            : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
        }`}
        aria-pressed={isBookmarked} // ✅ 3.4
        aria-label="북마크"
      >
        <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
// "use client";

// import { useEffect, useState, useCallback, useRef } from "react";
// import { createClient } from "@/utils/supabase/client";
// import { Heart, Eye, Bookmark } from "lucide-react";
// import {
//   RealtimeChannel,
//   RealtimePostgresChangesPayload,
// } from "@supabase/supabase-js";
// import { NewsRow } from "@/types";

// // ✅ 1. 실시간 페이로드 타입 정의 (any 해결)
// type LikePayload = { news_id: string; user_id: string };
// type BookmarkPayload = { news_id: string; user_id: string };

// type DetailActionsProps = {
//   id: string;
//   initialLikes: number;
//   initialViews: number;
//   initialIsLiked: boolean;
//   initialIsBookmarked: boolean;
// };

// export default function DetailActions({
//   id,
//   initialLikes,
//   initialViews,
//   initialIsLiked,
//   initialIsBookmarked,
// }: DetailActionsProps) {
//   const [supabase] = useState(() => createClient());

//   const [likes, setLikes] = useState(initialLikes);
//   const [views, setViews] = useState(initialViews);
//   const [isLiked, setIsLiked] = useState(initialIsLiked);
//   const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

//   const [liking, setLiking] = useState(false);
//   const [bookmarking, setBookmarking] = useState(false);

//   const channelRef = useRef<RealtimeChannel | null>(null);
//   const userIdRef = useRef<string | null>(null);
//   const lastSubscribedUserIdRef = useRef<string | null>(null);
//   const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const viewIncrementedRef = useRef(false);
//   const initialStateLoadedRef = useRef(false);

//   // ✅ 2. 상태 검증 로직을 useCallback으로 분리
//   const verifyState = useCallback(async () => {
//     try {
//       console.log(`[DetailActions] 🔍 Verifying state for ID: ${id}`);

//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       const userId = user?.id || null;
//       userIdRef.current = userId; // userIdRef도 함께 갱신

//       // DB에서 최신 카운트 조회
//       const { data: newsData, error: newsError } = await supabase
//         .from("news")
//         .select("like_count, view_count")
//         .eq("id", id)
//         .single();

//       if (newsError) {
//         console.error("[DetailActions] ❌ Failed to fetch news data:", newsError);
//         return;
//       }

//       // 로그인한 경우 like/bookmark 상태 확인
//       if (userId) {
//         const { data: likeData } = await supabase
//           .from("user_news_likes")
//           .select("news_id")
//           .eq("user_id", userId)
//           .eq("news_id", id)
//           .maybeSingle();

//         const { data: bookmarkData } = await supabase
//           .from("user_news_bookmarks")
//           .select("news_id")
//           .eq("user_id", userId)
//           .eq("news_id", id)
//           .maybeSingle();

//         console.log(
//           `[DetailActions] ✅ Verified state - likes: ${newsData.like_count}, views: ${newsData.view_count}, isLiked: ${!!likeData}, isBookmarked: ${!!bookmarkData}`
//         );

//         setLikes(newsData.like_count ?? 0);
//         setViews(newsData.view_count ?? 0);
//         setIsLiked(!!likeData);
//         setIsBookmarked(!!bookmarkData);
//       } else {
//         // 로그아웃 상태
//         console.log(
//           `[DetailActions] ✅ Verified state (no auth) - likes: ${newsData.like_count}, views: ${newsData.view_count}`
//         );

//         setLikes(newsData.like_count ?? 0);
//         setViews(newsData.view_count ?? 0);
//         setIsLiked(false);
//         setIsBookmarked(false);
//       }

//       initialStateLoadedRef.current = true;
//     } catch (err) {
//       console.error("[DetailActions] ❌ Failed to verify state:", err);
//     }
//   }, [id, supabase]);

//   // ✅ 3. 초기 마운트 시 상태 검증 1회 실행
//   useEffect(() => {
//     if (!initialStateLoadedRef.current) {
//       verifyState();
//     }
//   }, [verifyState]);

//   // ✅ FIX: Realtime 구독 (및 인증 상태 변경 처리)
//   useEffect(() => {
//     let isSubscribed = true;

//     const setupSubscriptions = async (userId: string | null) => {
//       if (lastSubscribedUserIdRef.current === userId) {
//         console.log(
//           `[DetailActions] ⏸️ Already subscribed for user: ${userId || "anon"}, skipping...`
//         );
//         return;
//       }

//       if (channelRef.current) {
//         console.log(`[DetailActions] 🧹 Removing old channel`);
//         await supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }

//       if (!isSubscribed) return;

//       lastSubscribedUserIdRef.current = userId;
//       userIdRef.current = userId; // verifyState와 별개로 구독용 ref도 갱신

//       const channelName = `news-detail:${id}:${userId || "anon"}`;
//       const channel = supabase.channel(channelName);
//       console.log(`[DetailActions] 🚀 Subscribing to: ${channelName}`);

//       channel.on(
//         "postgres_changes",
//         {
//           event: "UPDATE",
//           schema: "public",
//           table: "news",
//           filter: `id=eq.${id}`,
//         },
//         (payload: RealtimePostgresChangesPayload<NewsRow>) => {
//           console.log(`[DetailActions] ✅ REALTIME [news UPDATE]:`, payload.new);
//           if (payload.eventType === "UPDATE") {
//             const updatedNews = payload.new;
//             setLikes(updatedNews.like_count ?? 0);
//             setViews(updatedNews.view_count ?? 0);
//           }
//         }
//       );

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
//             // ✅ 1. 'any' 타입 문제 해결
//             (payload: RealtimePostgresChangesPayload<LikePayload>) => {
//               console.log(
//                 `[DetailActions] ✅ REALTIME [user_news_likes ${payload.eventType}]`,
//                 payload
//               );

//               // ✅ 1. 타입 적용
//               const newsId =
//                 payload.eventType === "INSERT"
//                   ? payload.new.news_id
//                   : payload.old.news_id;

//               if (newsId === id) {
//                 const liked = payload.eventType === "INSERT";
//                 console.log(`[DetailActions] 🔄 setIsLiked: ${liked}`);
//                 setIsLiked(liked);
//               }
//             }
//           )
//           .on(
//             "postgres_changes",
//             {
//               event: "*",
//               schema: "public",
//               table: "user_news_bookmarks",
//               filter: `user_id=eq.${userId}`,
//             },
//             // ✅ 1. 'any' 타입 문제 해결
//             (payload: RealtimePostgresChangesPayload<BookmarkPayload>) => {
//               console.log(
//                 `[DetailActions] ✅ REALTIME [user_news_bookmarks ${payload.eventType}]`,
//                 payload
//               );

//               // ✅ 1. 타입 적용
//               const newsId =
//                 payload.eventType === "INSERT"
//                   ? payload.new.news_id
//                   : payload.old.news_id;

//               if (newsId === id) {
//                 const bookmarked = payload.eventType === "INSERT";
//                 console.log(`[DetailActions] 🔄 setIsBookmarked: ${bookmarked}`);
//                 setIsBookmarked(bookmarked);
//               }
//             }
//           );
//       }

//       channel.subscribe((status, err) => {
//         if (status === "SUBSCRIBED") {
//           console.log(
//             `[DetailActions] ✅ SUBSCRIBED successfully for user: ${userId || "anon"}`
//           );
//         } else if (status === "CHANNEL_ERROR") {
//           console.error(`[DetailActions] ❌ CHANNEL_ERROR:`, err);
//         } else if (status === "TIMED_OUT") {
//           console.error(`[DetailActions] ⏱️ TIMED_OUT`);
//         }
//       });

//       channelRef.current = channel;
//     };

//     (async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       const userId = user?.id || null;
//       await setupSubscriptions(userId);
//     })();

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       console.log(
//         `[DetailActions] 👤 Auth changed: ${event}`,
//         session?.user?.id || "anon"
//       );

//       const newUserId = session?.user?.id || null;
//       const currentUserId = lastSubscribedUserIdRef.current;

//       if (newUserId === currentUserId) {
//         console.log(`[DetailActions] ⏸️ Same user, ignoring event: ${event}`);
//         return;
//       }

//       if (setupTimeoutRef.current) {
//         clearTimeout(setupTimeoutRef.current);
//       }

//       setupTimeoutRef.current = setTimeout(() => {
//         if (!isSubscribed) return;
//         console.log(
//           `[DetailActions] 🔄 User changed, re-subscribing and re-verifying...`
//         );
//         // 실시간 구독 재설정
//         setupSubscriptions(newUserId);
//         // ✅ 3. 인증 상태 변경 시, 상태 재검증 실행
//         verifyState();
//       }, 300);
//     });

//     return () => {
//       isSubscribed = false;
//       subscription?.unsubscribe();

//       if (setupTimeoutRef.current) {
//         clearTimeout(setupTimeoutRef.current);
//       }

//       if (channelRef.current) {
//         console.log(`[DetailActions] 🧹 Cleanup: removing channel`);
//         supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }

//       lastSubscribedUserIdRef.current = null;
//     };
//   }, [id, supabase, verifyState]); // ✅ verifyState 의존성 추가

//   // ✅ FIX: 조회수 증가 로직 (기존 코드와 동일 - 문제 없음)
//   useEffect(() => {
//     let mounted = true;

//     const incView = async () => {
//       try {
//         if (viewIncrementedRef.current) {
//           console.log(
//             `[DetailActions] ⏸️ View already incremented for ID: ${id}`
//           );
//           return;
//         }
//         console.log(`[DetailActions] 👁️ Incrementing view for ID: ${id}`);
//         viewIncrementedRef.current = true;
//         setViews((v) => v + 1);

//         const { error } = await supabase.rpc("news_increment_view", { p_id: id });

//         if (error) {
//           console.error("[DetailActions] ❌ RPC error:", error);
//           if (mounted) {
//             setViews((v) => Math.max(0, v - 1));
//             viewIncrementedRef.current = false;
//           }
//         } else {
//           console.log(`[DetailActions] ✅ View increment success for ID: ${id}`);
//         }
//       } catch (err) {
//         console.error("[DetailActions] ❌ View increment failed:", err);
//         if (mounted) {
//           setViews((v) => Math.max(0, v - 1));
//           viewIncrementedRef.current = false;
//         }
//       }
//     };

//     const timer = setTimeout(incView, 1000);

//     return () => {
//       mounted = false;
//       clearTimeout(timer);
//     };
//   }, [id, supabase]);

//   // 좋아요 토글 (기존 코드와 동일 - 문제 없음)
//   const handleLikeToggle = useCallback(async () => {
//     if (liking) {
//       console.log("[DetailActions] ⏸️ Already processing like...");
//       return;
//     }
//     setLiking(true);

//     console.log(
//       `[DetailActions] 💛 handleLikeToggle for ID: ${id}, current: ${isLiked}`
//     );

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     if (!user) {
//       alert("로그인이 필요합니다.");
//       setLiking(false);
//       return;
//     }

//     const currentlyLiked = isLiked;
//     const currentLikes = likes;

//     setIsLiked(!currentlyLiked);
//     setLikes(!currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1));

//     try {
//       if (currentlyLiked) {
//         const { error } = await supabase
//           .from("user_news_likes")
//           .delete()
//           .eq("user_id", user.id)
//           .eq("news_id", id);
//         if (error) throw error;
//       } else {
//         const { error } = await supabase
//           .from("user_news_likes")
//           .insert({ user_id: user.id, news_id: id });

//         if (error && error.code !== "23505") {
//           throw error;
//         } else if (error?.code === "23505") {
//           console.log(
//             "[DetailActions] ℹ️ Like already exists, keeping liked state"
//           );
//           setIsLiked(true);
//         }
//       }
//     } catch (err) {
//       console.error("[LikeToggle Error]", err);
//       setIsLiked(currentlyLiked);
//       setLikes(currentLikes);
//     } finally {
//       setLiking(false);
//     }
//   }, [liking, supabase, isLiked, likes, id]);

//   // 북마크 토글 (기존 코드와 동일 - 문제 없음)
//   const handleBookmarkToggle = useCallback(async () => {
//     if (bookmarking) {
//       console.log("[DetailActions] ⏸️ Already processing bookmark...");
//       return;
//     }
//     setBookmarking(true);

//     console.log(
//       `[DetailActions] 🔖 handleBookmarkToggle for ID: ${id}, current: ${isBookmarked}`
//     );

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     if (!user) {
//       alert("로그인이 필요합니다.");
//       setBookmarking(false);
//       return;
//     }

//     const currentlyBookmarked = isBookmarked;
//     setIsBookmarked(!currentlyBookmarked);

//     try {
//       if (currentlyBookmarked) {
//         const { error } = await supabase
//           .from("user_news_bookmarks")
//           .delete()
//           .eq("user_id", user.id)
//           .eq("news_id", id);
//         if (error) throw error;
//       } else {
//         const { error } = await supabase
//           .from("user_news_bookmarks")
//           .insert({ user_id: user.id, news_id: id });

//         if (error && error.code !== "23505") {
//           throw error;
//         } else if (error?.code === "23505") {
//           console.log(
//             "[DetailActions] ℹ️ Bookmark already exists, keeping bookmarked state"
//           );
//           setIsBookmarked(true);
//         }
//       }
//     } catch (err) {
//       console.error("[BookmarkToggle Error]", err);
//       setIsBookmarked(currentlyBookmarked);
//     } finally {
//       setBookmarking(false);
//     }
//   }, [bookmarking, supabase, isBookmarked, id]);

//   // JSX (기존 코드와 동일)
//   return (
//     <div className="flex justify-center gap-30 text-[#717182] py-6">
//       <button
//         onClick={handleLikeToggle}
//         disabled={liking}
//         className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
//           isLiked
//             ? "text-[#FF569B] bg-[#F7E6ED]"
//             : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
//         } ${liking ? "opacity-50" : ""}`}
//         aria-pressed={isLiked}
//         aria-label="좋아요"
//       >
//         <div className="flex gap-2 text-sm items-center ">
//           <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
//           <span className="font-semibold">{likes}</span>
//         </div>
//       </button>

//       <span className="cursor-pointer py-1 px-2 rounded-md" aria-label="조회수">
//         <div className="flex gap-2 text-sm items-center">
//           <Eye size={18} />
//           <span className="font-semibold">{views}</span>
//         </div>
//       </span>

//       <button
//         onClick={handleBookmarkToggle}
//         disabled={bookmarking}
//         className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
//           isBookmarked
//             ? "text-[#6758FF] bg-[#D8D4FF]"
//             : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
//         } ${bookmarking ? "opacity-50" : ""}`}
//         aria-pressed={isBookmarked}
//         aria-label="북마크"
//       >
//         <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
//       </button>
//     </div>
//   );
// }
// // src/app/news/[id]/DetailActions.tsx
// "use client";

// import { useEffect, useState, useCallback, useRef } from "react";
// import { createClient } from "@/utils/supabase/client";
// import { Heart, Eye, Bookmark } from "lucide-react";
// import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
// import { NewsRow } from "@/types";

// type DetailActionsProps = {
//   id: string;
//   initialLikes: number;
//   initialViews: number;
//   initialIsLiked: boolean;
//   initialIsBookmarked: boolean;
// };

// export default function DetailActions({
//   id,
//   initialLikes,
//   initialViews,
//   initialIsLiked,
//   initialIsBookmarked,
// }: DetailActionsProps) {
//   const [supabase] = useState(() => createClient());

//   const [likes, setLikes] = useState(initialLikes);
//   const [views, setViews] = useState(initialViews);
//   const [isLiked, setIsLiked] = useState(initialIsLiked);
//   const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

//   const [liking, setLiking] = useState(false);
//   const [bookmarking, setBookmarking] = useState(false);
//   const [hasViewed, setHasViewed] = useState(false);

//   const channelRef = useRef<RealtimeChannel | null>(null);
//   const userIdRef = useRef<string | null>(null);
//   const lastSubscribedUserIdRef = useRef<string | null>(null); // ✅ 마지막 구독 유저 ID
//   const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ debounce용

//   // ✅ FIX: Realtime 구독 - userId 기반 중복 방지
//   useEffect(() => {
//     let isSubscribed = true;

//     const setupSubscriptions = async (userId: string | null) => {
//       // ✅ 같은 유저로 이미 구독 중이면 무시
//       if (lastSubscribedUserIdRef.current === userId) {
//         console.log(`[DetailActions] ⏸️ Already subscribed for user: ${userId || "anon"}, skipping...`);
//         return;
//       }

//       // 기존 채널 정리
//       if (channelRef.current) {
//         console.log(`[DetailActions] 🧹 Removing old channel`);
//         await supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }

//       if (!isSubscribed) return;

//       // ✅ 현재 구독 중인 유저 기록
//       lastSubscribedUserIdRef.current = userId;
//       userIdRef.current = userId;

//       const channelName = `news-detail:${id}:${userId || "anon"}:${Date.now()}`;
//       const channel = supabase.channel(channelName);
//       console.log(`[DetailActions] 🚀 Subscribing to: ${channelName}`);

//       // news 테이블 구독
//       channel.on(
//         "postgres_changes",
//         {
//           event: "UPDATE",
//           schema: "public",
//           table: "news",
//           filter: `id=eq.${id}`,
//         },
//         (payload: RealtimePostgresChangesPayload<NewsRow>) => {
//           console.log(`[DetailActions] ✅ REALTIME [news UPDATE]:`, payload.new);
//           if (payload.eventType === "UPDATE") {
//             const updatedNews = payload.new;
//             setLikes(updatedNews.like_count ?? 0);
//             setViews(updatedNews.view_count ?? 0);
//           }
//         }
//       );

//       // 로그인한 사용자만 like/bookmark 상태 구독
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
//             (payload) => {
//               console.log(`[DetailActions] ✅ REALTIME [user_news_likes ${payload.eventType}]`, payload);
              
//               const newsId = payload.eventType === "INSERT" 
//                 ? (payload.new as any).news_id 
//                 : (payload.old as any).news_id;
              
//               if (newsId === id) {
//                 const liked = payload.eventType === "INSERT";
//                 console.log(`[DetailActions] 🔄 setIsLiked: ${liked}`);
//                 setIsLiked(liked);
//               }
//             }
//           )
//           .on(
//             "postgres_changes",
//             {
//               event: "*",
//               schema: "public",
//               table: "user_news_bookmarks",
//               filter: `user_id=eq.${userId}`,
//             },
//             (payload) => {
//               console.log(`[DetailActions] ✅ REALTIME [user_news_bookmarks ${payload.eventType}]`, payload);
              
//               const newsId = payload.eventType === "INSERT" 
//                 ? (payload.new as any).news_id 
//                 : (payload.old as any).news_id;
              
//               if (newsId === id) {
//                 const bookmarked = payload.eventType === "INSERT";
//                 console.log(`[DetailActions] 🔄 setIsBookmarked: ${bookmarked}`);
//                 setIsBookmarked(bookmarked);
//               }
//             }
//           );
//       }

//       // 구독 실행
//       channel.subscribe((status, err) => {
//         if (status === "SUBSCRIBED") {
//           console.log(`[DetailActions] ✅ SUBSCRIBED successfully for user: ${userId || "anon"}`);
//         } else if (status === "CHANNEL_ERROR") {
//           console.error(`[DetailActions] ❌ CHANNEL_ERROR:`, err);
//         } else if (status === "TIMED_OUT") {
//           console.error(`[DetailActions] ⏱️ TIMED_OUT`);
//         }
//       });

//       channelRef.current = channel;
//     };

//     // ✅ 초기 구독
//     (async () => {
//       const { data: { user } } = await supabase.auth.getUser();
//       const userId = user?.id || null;
//       await setupSubscriptions(userId);
//     })();

//     // ✅ Auth 상태 변경 감지 (debounce)
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//       console.log(`[DetailActions] 👤 Auth changed: ${event}`, session?.user?.id || "anon");
      
//       const newUserId = session?.user?.id || null;
//       const currentUserId = lastSubscribedUserIdRef.current;

//       // 같은 유저면 무시
//       if (newUserId === currentUserId) {
//         console.log(`[DetailActions] ⏸️ Same user, ignoring event: ${event}`);
//         return;
//       }

//       // debounce
//       if (setupTimeoutRef.current) {
//         clearTimeout(setupTimeoutRef.current);
//       }

//       setupTimeoutRef.current = setTimeout(() => {
//         if (!isSubscribed) return;
//         console.log(`[DetailActions] 🔄 User changed, re-subscribing...`);
//         setupSubscriptions(newUserId);
//       }, 300);
//     });

//     return () => {
//       isSubscribed = false;
//       subscription?.unsubscribe();
      
//       if (setupTimeoutRef.current) {
//         clearTimeout(setupTimeoutRef.current);
//       }

//       if (channelRef.current) {
//         console.log(`[DetailActions] 🧹 Cleanup: removing channel`);
//         supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }
      
//       lastSubscribedUserIdRef.current = null;
//     };
//   }, [id]);

//   // 조회수 증가 로직
//   useEffect(() => {
//     let mounted = true;

//     const incView = async () => {
//       try {
//         if (hasViewed) return;
//         setHasViewed(true);

//         console.log(`[DetailActions] 👁️ Incrementing view for ID: ${id}`);
//         setViews((v) => v + 1);

//         const { error } = await supabase.rpc("news_increment_view", { p_id: id });
        
//         if (error) throw error;
//         console.log(`[DetailActions] 👁️ RPC success for ID: ${id}`);
//       } catch (err) {
//         console.error("View increment failed:", err);
//         if (mounted) setViews((v) => Math.max(0, v - 1));
//       }
//     };

//     const timer = setTimeout(incView, 1000);

//     return () => {
//       mounted = false;
//       clearTimeout(timer);
//     };
//   }, [id, hasViewed, supabase]);

//   // 좋아요 토글
//   const handleLikeToggle = useCallback(async () => {
//     if (liking) {
//       console.log("[DetailActions] ⏸️ Already processing like...");
//       return;
//     }
//     setLiking(true);

//     console.log(`[DetailActions] 💛 handleLikeToggle for ID: ${id}, current: ${isLiked}`);
    
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       alert("로그인이 필요합니다.");
//       setLiking(false);
//       return;
//     }

//     const currentlyLiked = isLiked;
//     const currentLikes = likes;

//     // 낙관적 업데이트
//     setIsLiked(!currentlyLiked);
//     setLikes(!currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1));

//     try {
//       if (currentlyLiked) {
//         const { error } = await supabase
//           .from("user_news_likes")
//           .delete()
//           .eq("user_id", user.id)
//           .eq("news_id", id);
//         if (error) throw error;
//       } else {
//         const { error } = await supabase
//           .from("user_news_likes")
//           .insert({ user_id: user.id, news_id: id });
        
//         if (error && error.code !== "23505") {
//           throw error;
//         } else if (error?.code === "23505") {
//           console.log("[DetailActions] ℹ️ Like already exists, keeping liked state");
//           setIsLiked(true);
//         }
//       }
//     } catch (err) {
//       console.error("[LikeToggle Error]", err);
//       // 롤백
//       setIsLiked(currentlyLiked);
//       setLikes(currentLikes);
//     } finally {
//       setLiking(false);
//     }
//   }, [liking, supabase, isLiked, likes, id]);

//   // 북마크 토글
//   const handleBookmarkToggle = useCallback(async () => {
//     if (bookmarking) {
//       console.log("[DetailActions] ⏸️ Already processing bookmark...");
//       return;
//     }
//     setBookmarking(true);

//     console.log(`[DetailActions] 🔖 handleBookmarkToggle for ID: ${id}, current: ${isBookmarked}`);
    
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       alert("로그인이 필요합니다.");
//       setBookmarking(false);
//       return;
//     }

//     const currentlyBookmarked = isBookmarked;
//     setIsBookmarked(!currentlyBookmarked);

//     try {
//       if (currentlyBookmarked) {
//         const { error } = await supabase
//           .from("user_news_bookmarks")
//           .delete()
//           .eq("user_id", user.id)
//           .eq("news_id", id);
//         if (error) throw error;
//       } else {
//         const { error } = await supabase
//           .from("user_news_bookmarks")
//           .insert({ user_id: user.id, news_id: id });
        
//         if (error && error.code !== "23505") {
//           throw error;
//         } else if (error?.code === "23505") {
//           console.log("[DetailActions] ℹ️ Bookmark already exists, keeping bookmarked state");
//           setIsBookmarked(true);
//         }
//       }
//     } catch (err) {
//       console.error("[BookmarkToggle Error]", err);
//       setIsBookmarked(currentlyBookmarked);
//     } finally {
//       setBookmarking(false);
//     }
//   }, [bookmarking, supabase, isBookmarked, id]);

//   return (
//     <div className="flex justify-center gap-30 text-[#717182] py-6">
//       <button
//         onClick={handleLikeToggle}
//         disabled={liking}
//         className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
//           isLiked
//             ? "text-[#FF569B] bg-[#F7E6ED]"
//             : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
//         } ${liking ? "opacity-50" : ""}`}
//         aria-pressed={isLiked}
//         aria-label="좋아요"
//       >
//         <div className="flex gap-2 text-sm items-center ">
//           <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
//           <span className="font-semibold">{likes}</span>
//         </div>
//       </button>

//       <span className="cursor-pointer py-1 px-2 rounded-md" aria-label="조회수">
//         <div className="flex gap-2 text-sm items-center">
//           <Eye size={18} />
//           <span className="font-semibold">{views}</span>
//         </div>
//       </span>

//       <button
//         onClick={handleBookmarkToggle}
//         disabled={bookmarking}
//         className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
//           isBookmarked
//             ? "text-[#6758FF] bg-[#D8D4FF]"
//             : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
//         } ${bookmarking ? "opacity-50" : ""}`}
//         aria-pressed={isBookmarked}
//         aria-label="북마크"
//       >
//         <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
//       </button>
//     </div>
//   );
// }
// // src/app/news/[id]/DetailActions.tsx
// 'use client'

// import { useEffect, useState, useCallback } from 'react' // [수정] useCallback 임포트
// import { createClient } from "@/utils/supabase/client"
// import { Heart, Eye, Bookmark } from 'lucide-react'

// type DetailActionsProps = {
//   id: string
//   initialLikes: number
//   initialViews: number
//   initialIsLiked: boolean;
//   initialIsBookmarked: boolean;
// }

// export default function DetailActions({
//   id,
//   initialLikes,
//   initialViews,
//   initialIsLiked,
//   initialIsBookmarked
// }: DetailActionsProps) {
//   // [수정] 1. useState를 사용해 Supabase 클라이언트를 한 번만 생성 (안정화)
//   const [supabase] = useState(() => createClient());

//   const [likes, setLikes] = useState(initialLikes)
//   const [views, setViews] = useState(initialViews)
//   const [isLiked, setIsLiked] = useState(initialIsLiked)
//   const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)

//   const [liking, setLiking] = useState(false)
//   const [bookmarking, setBookmarking] = useState(false) 
//   const [hasViewed, setHasViewed] = useState(false)

//   // 조회수 자동 증가 (첫 렌더링 시 1회)
//   useEffect(() => {
//     let mounted = true
    
//     const incView = async () => {
//       try {
//         if (hasViewed) return 
//         setHasViewed(true) 
        
//         setViews(v => v + 1) // 1. 낙관적 업데이트
        
//         await supabase.rpc('news_increment_view', { p_id: id })
      
//       } catch (err: unknown) { // [수정] 4. any -> unknown
//         console.error("View increment failed:", err instanceof Error ? err.message : JSON.stringify(err));
//         if (mounted) setViews(v => Math.max(0, v - 1))
//       }
//     }
    
//     incView()
    
//     return () => { mounted = false }
//   }, [id, hasViewed, supabase]) // [수정] 2. 안정화된 supabase 의존성 추가

//   // [수정] 3. useCallback 래핑
//   const handleLikeToggle = useCallback(async () => {
//     if (liking) return;
//     setLiking(true);

//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       alert("로그인이 필요합니다.");
//       setLiking(false);
//       return;
//     }

//     const currentlyLiked = isLiked;
//     const currentLikes = likes;
    
//     setIsLiked(!currentlyLiked);
//     setLikes(!currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1));

//     try {
//       if (currentlyLiked) {
//         const { error } = await supabase
//           .from("user_news_likes")
//           .delete()
//           .eq("user_id", user.id)
//           .eq("news_id", id);
//         if (error) throw error;
//       } else {
//         const { error } = await supabase
//           .from("user_news_likes")
//           .insert({ user_id: user.id, news_id: id });
//         if (error) throw error;
//       }
//     } catch (err: unknown) { // [수정] 4. any -> unknown
//       console.error("[LikeToggle Error]", err instanceof Error ? err.message : JSON.stringify(err));
//       // 롤백
//       setIsLiked(currentlyLiked);
//       setLikes(currentLikes);
//     } finally {
//       setLiking(false);
//     }
//   }, [liking, supabase, isLiked, likes, id]); // [수정] 3. 의존성 배열 추가

//   // [수정] 3. useCallback 래핑
//   const handleBookmarkToggle = useCallback(async () => {
//     if (bookmarking) return;
//     setBookmarking(true);

//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       alert("로그인이 필요합니다.");
//       setBookmarking(false);
//       return;
//     }

//     const currentlyBookmarked = isBookmarked;
//     setIsBookmarked(!currentlyBookmarked);

//     try {
//       if (currentlyBookmarked) {
//         const { error } = await supabase
//           .from("user_news_bookmarks")
//           .delete()
//           .eq("user_id", user.id)
//           .eq("news_id", id);
//         if (error) throw error;
//       } else {
//         const { error } = await supabase
//           .from("user_news_bookmarks")
//           .insert({ user_id: user.id, news_id: id });
//         if (error) throw error;
//       }
//     } catch (err: unknown) { // [수정] 4. any -> unknown
//       console.error("[BookmarkToggle Error]", err instanceof Error ? err.message : JSON.stringify(err));
//       // 롤백
//       setIsBookmarked(currentlyBookmarked);
//     } finally {
//       setBookmarking(false);
//     }
//   }, [bookmarking, supabase, isBookmarked, id]); // [수S정] 3. 의존성 배열 추가


//   return (
//     <div className="flex justify-center gap-30 text-[#717182] py-6">
//       <button
//         onClick={handleLikeToggle}
//         disabled={liking}
//         className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
//           isLiked
//             ? "text-[#FF569B] bg-[#F7E6ED]"
//             : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
//         }`}
//         aria-pressed={isLiked}
//         aria-label="좋아요"
//       >
//         <div className="flex gap-2 text-sm items-center ">
//           <Heart size={18} />
//           <span className="font-semibold">{likes}</span>
//         </div>
//       </button>

//       <span
//         className="cursor-pointer py-1 px-2 rounded-md"
//         aria-label="조회수"
//       >
//         <div className="flex gap-2 text-sm items-center">
//           <Eye size={18} />
//           <span className="font-semibold">{views}</span>
//         </div>
//       </span>

//       <button
//         onClick={handleBookmarkToggle}
//         disabled={bookmarking}
//         className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
//           isBookmarked
//             ? "text-[#6758FF] bg-[#D8D4FF]"
//             : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
//         }`}
//         aria-pressed={isBookmarked}
//         aria-label="북마크"
//       >
//         <Bookmark size={18} />
//       </button>
//     </div>
//   )
// }