import { useMemo } from "react";
import { NewsItemWithState, SortKey } from "@/types";
import Post from "./post/Post";
import NewsItem from "@/components/news/NewsItem";
import NoPosts from "./post/NoPosts";
import NewsItemSkeleton from "@/components/news/NewsItemSkeleton";
import { FadeLoader } from "react-spinners"; // [추가]
import { PostType } from "@/types/Post";

// [수정] Props 타입 확장
type AllProps = {
  posts: PostType[];
  news: NewsItemWithState[];
  isLoading: boolean;
  sortBy: SortKey;
  onNewsLikeToggle: (id: string) => void;
  onNewsBookmarkToggle: (id: string) => void;
  onPostLikeToggle: (id: string) => void;
  onPostBookmarkToggle: (id: string, type: "post" | "news") => void;
  // [추가] 무한 스크롤 props
  newsLoadingMore: boolean;
  hasNextPage: boolean;
  loadMoreTriggerRef: (node: HTMLDivElement) => void;
};

type CombinedItem =
  | (PostType & { itemType: "post" })
  | (NewsItemWithState & { itemType: "news" });

export default function All({
  posts,
  news,
  isLoading,
  sortBy, // [추가]
  onNewsLikeToggle,
  onNewsBookmarkToggle,
  onPostLikeToggle,
  onPostBookmarkToggle,
  // [추가] 무한 스크롤 props 받기
  newsLoadingMore,
  hasNextPage,
  loadMoreTriggerRef,
}: AllProps) {
  const combinedData = useMemo(() => {
    const typedPosts: CombinedItem[] = posts.map((p) => ({
      ...p,
      itemType: "post",
    }));

    const typedNews: CombinedItem[] = news.map((n) => ({
      ...n,
      itemType: "news",
    }));

    // [수정] sortBy prop에 따라 정렬 로직 변경
    return [...typedPosts, ...typedNews].sort((a, b) => {
      // 1. 인기순 정렬
      if (sortBy === "like_count") {
        const likesA = a.like_count ?? 0;
        const likesB = b.like_count ?? 0;
        // 좋아요 수가 다르면 그것으로 정렬
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        // 같다면 생성일로 2차 정렬
      }

      // 2. 최신순(created_at) 정렬 (기본값)
      //    (요청사항: news도 published_at 대신 created_at 사용)
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [posts, news, sortBy]); // [수정] sortBy 의존성 추가

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[...Array(5)].map((_, i) => (
          <NewsItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (combinedData.length === 0) {
    return <NoPosts />;
  }

  return (
    // [수정] div 대신 React Fragment 사용
    <>
      <div className="space-y-8">
        {combinedData.map((item, index) => {
          if (item.itemType === "post") {
            return (
              <Post
                key={`post-${item.id}`}
                data={item}
                onLikeToggle={onPostLikeToggle}
                onBookmarkToggle={onPostBookmarkToggle}
              />
            );
          } else {
            // item.itemType === "news"
            return (
              <NewsItem
                key={`news-${item.id}`}
                item={item}
                onLikeToggle={onNewsLikeToggle}
                onBookmarkToggle={onNewsBookmarkToggle}
              />
            );
          }
        })}
      </div>

      {/* [추가] '뉴스' 탭과 동일한 무한 스크롤 UI */}
      <div className="flex justify-center items-center py-6" role="status">
        {newsLoadingMore && (
          <>
            <span className="sr-only">추가 로딩 중...</span>
            <FadeLoader color="#808080" />
          </>
        )}
        {!newsLoadingMore && !hasNextPage && combinedData.length > 0 && (
          <p className="text-center text-gray-500">
            모든 콘텐츠를 불러왔습니다.
          </p>
        )}
      </div>
      <div
        ref={loadMoreTriggerRef}
        style={{ height: "1px" }}
        aria-hidden="true"
      />
    </>
  );
}
