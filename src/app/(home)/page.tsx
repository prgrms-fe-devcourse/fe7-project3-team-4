"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import All from "@/components/home/All";
import Prompt from "@/components/home/Prompt";
import TopBar from "@/components/home/TobBar";
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
    avatar_url: string | null; // [추가]
  } | null;
};
export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  const [posts, setPosts] = useState<PostType[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const activeTab: Tab = useMemo(() => {
    const type = searchParams.get("type") || "all";
    return typeToTab[type] ?? "전체";
  }, [searchParams]);

  const activeSubType = useMemo(() => {
    return searchParams.get("sub_type");
  }, [searchParams]);

  const {
    isLoading: newsLoading,
    isLoadingMore: newsLoadingMore,
    newsList,
    message,
    hasNextPage,
    sortBy,
    handleSortChange,
    handleLikeToggle: handleNewsLikeToggle,
    handleBookmarkToggle: handleNewsBookmarkToggle,
    loadMoreTriggerRef,
    fileInputRef,
    loadingUpload,
    handleFileChange,
    triggerFileInput,
  } = useNewsFeedContext();

  // [수정] 'posts' 데이터 로딩 (profiles join 추가)
  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      let query = supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id (
            display_name,
            email,
            avatar_url
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
        );
      if (sortBy === "like_count") {
        query = query.order("like_count", {
          ascending: false,
          nullsFirst: true,
        });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query; // [수정] query 실행

      if (error) {
        console.error("Error fetching posts:", error);
      } else if (data) {
        const typedData = data as unknown as SupabasePostItem[];
        const postsWithState: PostType[] = typedData.map((item) => ({
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
          // [수정] profiles에 avatar_url 매핑
          profiles: item.profiles
            ? {
                display_name: item.profiles.display_name,
                email: item.profiles.email,
                avatar_url: item.profiles.avatar_url,
              }
            : undefined,
        }));
        setPosts(postsWithState);
      }
      setPostsLoading(false);
    };

    fetchPosts();
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          const updatedPost = payload.new as {
            id: string;
            comment_count: number;
            like_count?: number;
          };
          setPosts((prev) =>
            prev.map((post) =>
              post.id === updatedPost.id
                ? {
                    ...post,
                    comment_count: updatedPost.comment_count,
                    like_count: updatedPost.like_count ?? post.like_count,
                  }
                : post
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, sortBy]);

  const postsByType = useMemo(
    () => ({
      prompt: posts.filter((post) => post.post_type === "prompt"),
      free: posts.filter((post) => post.post_type === "free"),
      weekly: posts.filter((post) => post.post_type === "weekly"),
    }),
    [posts]
  );

  const selectedPost = useMemo(() => {
    const id = searchParams.get("id");
    if (!id || activeTab === "뉴스") return null;

    if (activeTab !== "전체") {
      const currentType = tabToType[activeTab];
      const post = posts.find((p) => p.id === id);
      return post && post.post_type === currentType ? post : null;
    }

    return posts.find((post) => post.id === id) ?? null;
  }, [searchParams, posts, activeTab]);

  const handleTabChange = (tab: Tab) => {
    const scrollContainer = document.querySelector(".scrollbar-custom");
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }

    const type = tabToType[tab];
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    params.delete("posttype");
    params.delete("sub_type");

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
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const handlePostLikeToggle = useCallback(
    async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const currentItem = posts.find((item) => item.id === id);
      if (!currentItem) return;

      const isCurrentlyLiked = currentItem.isLiked;
      const currentLikes = currentItem.like_count ?? 0;

      // 1️⃣ 낙관적 업데이트
      setPosts((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isLiked: !isCurrentlyLiked,
                like_count: !isCurrentlyLiked
                  ? currentLikes + 1
                  : Math.max(0, currentLikes - 1),
              }
            : item
        )
      );

      try {
        // 2️⃣ user_post_likes 삽입/삭제만 수행 (트리거가 like_count 자동 반영)
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
          // 중복 좋아요 시 에러 23505는 무시
          if (error && error.code !== "23505") throw error;
        }
      } catch (err) {
        console.error("Error toggling like:", err);

        // 3️⃣ 실패 시 롤백
        setPosts((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, isLiked: isCurrentlyLiked, like_count: currentLikes }
              : item
          )
        );
      }
    },
    [supabase, posts]
  );

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

      const currentItem = posts.find((item) => item.id === id);
      if (!currentItem) return;

      const isCurrentlyBookmarked = currentItem.isBookmarked;

      // 1. 낙관적 업데이트
      setPosts((prev) =>
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

      // 2. DB 업데이트
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
        // 3. 롤백
        console.log(err);
        setPosts((prev) =>
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
    [supabase, posts, handleNewsBookmarkToggle]
  );

  return (
    <>
      <section className="relative max-w-2xl mx-auto">
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

        {selectedPost ? (
          <PostDetail
            post={selectedPost}
            onBack={handleBack}
            onLikeToggle={handlePostLikeToggle} // ✅ 추가
            onBookmarkToggle={handlePostBookmarkToggle} // ✅ 추가
          />
        ) : (
          <>
            <div className="space-y-8 pb-6">
              {activeTab === "전체" && (
                <All
                  posts={posts}
                  news={newsList}
                  isLoading={postsLoading || newsLoading}
                  sortBy={sortBy} // [추가] sortBy prop 전달
                  onNewsLikeToggle={handleNewsLikeToggle}
                  onNewsBookmarkToggle={handleNewsBookmarkToggle}
                  onPostLikeToggle={handlePostLikeToggle}
                  onPostBookmarkToggle={handlePostBookmarkToggle}
                  newsLoadingMore={newsLoadingMore}
                  hasNextPage={hasNextPage}
                  loadMoreTriggerRef={loadMoreTriggerRef}
                  activeTab={activeTab} // [✅ 수정] activeTab prop 전달
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
                    {newsLoadingMore && (
                      <>
                        <span className="sr-only">추가 로딩 중...</span>
                        <FadeLoader color="#808080" />
                      </>
                    )}
                    {!newsLoadingMore &&
                      !hasNextPage &&
                      newsList.length > 0 && (
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
                  activeTab={activeTab} // [✅ 수정] activeTab prop 전달
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
            </div>
          </>
        )}
      </section>
    </>
  );
}