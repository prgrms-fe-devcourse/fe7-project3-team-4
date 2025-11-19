/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer"; // 👈 무한 스크롤 감지용 (설치 필요)
import All from "@/components/home/All";
import Prompt from "@/components/home/Prompt";
import TopBar from "@/components/home/TopBar";
import Free from "@/components/home/Free";
import Weekly from "@/components/home/Weekly";
import PostDetail from "@/components/home/post/PostDetail";
import { useNewsFeedContext } from "@/context/NewsFeedContext";
import NewsFeed from "@/components/news/NewsFeed";
import FeedStatus from "@/components/news/FeedStatus";
import { FadeLoader } from "react-spinners";
import IntroAnimation from "@/components/intro/IntroAnimation";
import { PostType } from "@/types/Post";
import { createClient } from "@/utils/supabase/client";
import { Json } from "@/utils/supabase/supabase";
import NewsItemSkeleton from "@/components/news/NewsItemSkeleton";
import NewsDetail from "@/components/news/NewsDetail";

const PAGE_SIZE = 10; // 한 번에 불러올 게시글 수

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

// Supabase에서 반환되는 원본 데이터 타입 정의
type SupabasePostItem = {
  id: string;
  title: string | null;
  content: Json;
  created_at: string | null;
  post_type: string | null;
  hashtags: string[] | null;
  like_count: number | null;
  view_count: number | null;
  comment_count: number | null;
  user_id: string | null;
  model: string | null;
  result_mode: string | null;
  email: string | null;
  thumbnail: string | null;
  subtitle: string | null;
  user_post_likes: { user_id: string }[];
  user_post_bookmarks: { user_id: string }[];
  profiles: {
    display_name: string;
    email: string;
    avatar_url: string | null;
    equipped_badge_id: string | null;
  } | null;
};

export default function HomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  
  // 무한 스크롤 감지용 ref
  const { ref: loadMoreRef, inView } = useInView();

  const [detailLoading, setDetailLoading] = useState(false);

  const {
    isLoading: newsLoading,
    isLoadingMore: newsLoadingMore,
    newsList,
    message,
    hasNextPage: newsHasNextPage,
    sortBy,
    handleSortChange,
    handleLikeToggle: handleNewsLikeToggle,
    handleBookmarkToggle: handleNewsBookmarkToggle,
    loadMoreTriggerRef: newsLoadMoreTriggerRef,
    fileInputRef,
    loadingUpload,
    handleFileChange,
    triggerFileInput,
  } = useNewsFeedContext();

  const activeTab: Tab = useMemo(() => {
    const type = searchParams.get("type") || "all";
    return typeToTab[type] ?? "전체";
  }, [searchParams]);

  const activeSubType = useMemo(() => {
    return searchParams.get("sub_type");
  }, [searchParams]);

  // 🌟 [변경 1] useInfiniteQuery로 페이지네이션 적용
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
  } = useInfiniteQuery({
    queryKey: ["posts", sortBy],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id (
            display_name,
            email,
            avatar_url,
            equipped_badge_id
          ),
          user_post_likes!left(user_id),
          user_post_bookmarks!left(user_id)
        `
        )
        .filter(
          "user_post_likes.user_id",
          "eq",
          userId || "00000000-0000-0000-0000-000000000000"
        )
        .filter(
          "user_post_bookmarks.user_id",
          "eq",
          userId || "00000000-0000-0000-0000-000000000000"
        )
        .range(from, to); // 👈 범위 제한 추가

      if (sortBy === "like_count") {
        query = query.order("like_count", {
          ascending: false,
          nullsFirst: true,
        });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: fetchedData, error } = await query;
      if (error) throw error;

      const typedData = fetchedData as unknown as SupabasePostItem[];
      return typedData.map((item) => ({
        id: item.id,
        title: item.title || "",
        content: item.content,
        created_at: item.created_at || "",
        post_type: item.post_type || "",
        hashtags: item.hashtags || undefined,
        like_count: item.like_count || 0,
        comment_count: item.comment_count || 0,
        view_count: item.view_count || 0,
        user_id: item.user_id || "",
        model: (item.model as "GPT" | "Gemini") || undefined,
        result_mode: (item.result_mode as "text" | "image") || undefined,
        thumbnail: item.thumbnail || "",
        subtitle: item.subtitle || "",
        isLiked: !!(item.user_post_likes && item.user_post_likes.length > 0),
        isBookmarked: !!(
          item.user_post_bookmarks && item.user_post_bookmarks.length > 0
        ),
        profiles: item.profiles
          ? {
              display_name: item.profiles.display_name,
              email: item.profiles.email,
              avatar_url: item.profiles.avatar_url,
              equipped_badge_id: item.profiles.equipped_badge_id,
            }
          : undefined,
      }));
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    staleTime: 60 * 1000,
  });

  // 🌟 [변경 2] 데이터 평탄화 (InfiniteData -> Array)
  const posts = useMemo(() => {
    return data?.pages.flatMap((page) => page) || [];
  }, [data]);

  // 🌟 [변경 3] 스크롤 바닥 감지 시 다음 페이지 로드
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 🌟 [변경 4] Realtime 구독 (INSERT, UPDATE, DELETE 처리)
  useEffect(() => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          // 1. UPDATE: 기존 캐시 수정
          if (payload.eventType === "UPDATE") {
            const updatedPost = payload.new as Partial<PostType>;
            queryClient.setQueryData(["posts", sortBy], (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page: PostType[]) =>
                  page.map((post) =>
                    post.id === updatedPost.id
                      ? {
                          ...post,
                          comment_count:
                            updatedPost.comment_count ?? post.comment_count,
                          like_count:
                            updatedPost.like_count ?? post.like_count,
                        }
                      : post
                  )
                ),
              };
            });
          }

          // 2. DELETE: 캐시에서 제거
          if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            queryClient.setQueryData(["posts", sortBy], (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page: PostType[]) =>
                  page.filter((post) => post.id !== deletedId)
                ),
              };
            });
          }

          // 3. INSERT: 목록 새로고침 (새 글은 프로필 정보 JOIN이 필요하므로 refetch 권장)
          if (payload.eventType === "INSERT") {
            // 최신순 정렬일 때만 즉시 반응하거나, 사용자 경험을 위해 전체 갱신
            queryClient.invalidateQueries({ queryKey: ["posts"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, sortBy, queryClient]);

  const selectedItem = useMemo(() => {
    const id = searchParams.get("id");
    if (!id) return null;

    const newsItem = newsList.find((n) => n.id === id);
    if (newsItem) {
      return { type: "news" as const, data: newsItem };
    }

    const postItem = posts.find((p) => p.id === id);
    if (postItem) {
      return { type: "post" as const, data: postItem };
    }
    return null;
  }, [searchParams, newsList, posts]);

  // 상세 페이지 로딩 처리
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setDetailLoading(true);
      const timer = setTimeout(() => setDetailLoading(false), 100);
      return () => clearTimeout(timer);
    } else {
      setDetailLoading(false);
    }
  }, [searchParams]);

  const postsByType = useMemo(
    () => ({
      prompt: posts.filter((post) => post.post_type === "prompt"),
      free: posts.filter((post) => post.post_type === "free"),
      weekly: posts.filter((post) => post.post_type === "weekly"),
    }),
    [posts]
  );

  const handleTabChange = (tab: Tab) => {
    const scrollContainer = document.querySelector(".scrollbar-custom");
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    params.delete("posttype");
    params.delete("sub_type");

    if (tab !== activeTab) {
      setDetailLoading(false);
    }

    const type = tabToType[tab];
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }

    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    params.delete("posttype");
    setDetailLoading(false);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // 🌟 [변경 5] 좋아요 Optimistic Update (Infinite Query 구조 대응)
  const handlePostLikeToggle = useCallback(
    async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const previousData = queryClient.getQueryData<any>(["posts", sortBy]);
      let isCurrentlyLiked = false;
      let currentLikes = 0;

      // 현재 상태 찾기
      if (previousData?.pages) {
        for (const page of previousData.pages) {
          const item = page.find((p: PostType) => p.id === id);
          if (item) {
            isCurrentlyLiked = item.isLiked;
            currentLikes = item.like_count ?? 0;
            break;
          }
        }
      }

      // UI 즉시 업데이트
      queryClient.setQueryData(["posts", sortBy], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: PostType[]) =>
            page.map((post) =>
              post.id === id
                ? {
                    ...post,
                    isLiked: !isCurrentlyLiked,
                    like_count: !isCurrentlyLiked
                      ? currentLikes + 1
                      : Math.max(0, currentLikes - 1),
                  }
                : post
            )
          ),
        };
      });

      try {
        if (isCurrentlyLiked) {
          const { error } = await supabase
            .from("user_post_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("post_id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_post_likes")
            .insert({ user_id: user.id, post_id: id });
          if (error && error.code !== "23505") throw error;
        }
      } catch (err) {
        console.error("Error toggling like:", err);
        // 에러 시 롤백
        if (previousData) {
          queryClient.setQueryData(["posts", sortBy], previousData);
        }
      }
    },
    [supabase, queryClient, sortBy]
  );

  // 🌟 [변경 6] 북마크 Optimistic Update (Infinite Query 구조 대응)
  const handlePostBookmarkToggle = useCallback(
    async (id: string, type: "post" | "news") => {
      if (type === "news") {
        handleNewsBookmarkToggle(id);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const previousData = queryClient.getQueryData<any>(["posts", sortBy]);
      let isCurrentlyBookmarked = false;

      // 현재 상태 찾기
      if (previousData?.pages) {
        for (const page of previousData.pages) {
          const item = page.find((p: PostType) => p.id === id);
          if (item) {
            isCurrentlyBookmarked = item.isBookmarked;
            break;
          }
        }
      }

      // UI 즉시 업데이트
      queryClient.setQueryData(["posts", sortBy], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: PostType[]) =>
            page.map((post) =>
              post.id === id
                ? {
                    ...post,
                    isBookmarked: !isCurrentlyBookmarked,
                  }
                : post
            )
          ),
        };
      });

      try {
        if (isCurrentlyBookmarked) {
          const { error } = await supabase
            .from("user_post_bookmarks")
            .delete()
            .eq("user_id", user.id)
            .eq("post_id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_post_bookmarks")
            .insert({ user_id: user.id, post_id: id });
          if (error && error.code !== "23505") throw error;
        }
      } catch (err) {
        console.error(err);
        if (previousData) {
          queryClient.setQueryData(["posts", sortBy], previousData);
        }
      }
    },
    [supabase, queryClient, sortBy, handleNewsBookmarkToggle]
  );

  return (
    <>
      <section className="relative max-w-2xl mx-auto px-2 lg:p-6">
        <IntroAnimation />
        <input
          type="file"
          ref={fileInputRef}
          accept=".html,.htm"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="mb-5 sticky top-0 z-20">
          <TopBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            loadingUpload={loadingUpload}
            onAddPostClick={triggerFileInput}
          />
        </div>

        {searchParams.get("id") ? (
          // 상세 페이지 렌더링
          detailLoading || postsLoading || newsLoading ? (
            <NewsItemSkeleton />
          ) : selectedItem ? (
            selectedItem.type === "news" ? (
              <NewsDetail news={selectedItem.data} onBack={handleBack} />
            ) : (
              <PostDetail
                post={selectedItem.data}
                onBack={handleBack}
                onLikeToggle={handlePostLikeToggle}
                onBookmarkToggle={handlePostBookmarkToggle}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <p className="text-gray-500 text-center">
                콘텐츠를 찾을 수 없습니다.
              </p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                목록으로 돌아가기
              </button>
            </div>
          )
        ) : (
          // 목록 렌더링
          <>
            <div className="space-y-8 pb-6">
              {activeTab === "전체" && (
                <All
                  posts={posts} // 평탄화된 데이터 전달
                  news={newsList}
                  isLoading={postsLoading || newsLoading}
                  sortBy={sortBy}
                  onNewsLikeToggle={handleNewsLikeToggle}
                  onNewsBookmarkToggle={handleNewsBookmarkToggle}
                  onPostLikeToggle={handlePostLikeToggle}
                  onPostBookmarkToggle={handlePostBookmarkToggle}
                  newsLoadingMore={newsLoadingMore}
                  hasNextPage={newsHasNextPage}
                  loadMoreTriggerRef={newsLoadMoreTriggerRef}
                  activeTab={activeTab}
                />
              )}

              {activeTab === "뉴스" && (
                <section aria-label="뉴스 피드">
                  <FeedStatus
                    isLoading={newsLoading}
                    listLength={newsList.length}
                    message={loadingUpload ? "업로드 중..." : message}
                  />
                  <NewsFeed
                    newsList={newsList}
                    onLikeToggle={handleNewsLikeToggle}
                    onBookmarkToggle={handleNewsBookmarkToggle}
                    isLoading={newsLoading}
                  />
                  <div
                    className="flex justify-center items-center py-6"
                    role="status"
                  >
                    {newsLoadingMore && <FadeLoader color="#808080" />}
                    {!newsLoadingMore &&
                      !newsHasNextPage &&
                      newsList.length > 0 && (
                        <p className="text-center text-gray-500">
                          모든 뉴스를 불러왔습니다.
                        </p>
                      )}
                  </div>
                  <div
                    ref={newsLoadMoreTriggerRef}
                    style={{ height: "1px" }}
                    aria-hidden="true"
                  />
                </section>
              )}

              {activeTab === "프롬프트" && (
                <Prompt
                  data={postsByType.prompt}
                  onLikeToggle={handlePostLikeToggle}
                  onBookmarkToggle={handlePostBookmarkToggle}
                  activeSubType={activeSubType}
                />
              )}
              {activeTab === "자유" && (
                <Free
                  data={postsByType.free}
                  onLikeToggle={handlePostLikeToggle}
                  onBookmarkToggle={handlePostBookmarkToggle}
                  activeTab={activeTab}
                />
              )}
              {activeTab === "주간" && (
                <Weekly
                  data={postsByType.weekly}
                  onLikeToggle={handlePostLikeToggle}
                  onBookmarkToggle={handlePostBookmarkToggle}
                  activeSubType={activeSubType}
                />
              )}

              {/* 🌟 [추가] 게시글 무한 스크롤 로딩 트리거 (전체/프롬프트/자유/주간 탭에서만 동작) */}
              {activeTab !== "뉴스" && (
                <div
                  ref={loadMoreRef}
                  className="flex justify-center items-center py-6 min-h-[50px]"
                >
                  {isFetchingNextPage && <FadeLoader color="#808080" />}
                  {!hasNextPage && posts.length > 0 && (
                    <p className="text-center text-gray-500">
                      모든 게시글을 불러왔습니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}