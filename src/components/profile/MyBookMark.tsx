// src/components/profile/MyBookMark.tsx
import Post from "../home/post/Post";
import NewsItem from "../news/NewsItem";
import EmptyActivity from "./EmptyActivity";
import { NewsItemWithState, Post as PostType } from "@/types";

type BookmarkedItem =
  | (PostType & { type: "post" })
  | (NewsItemWithState & { type: "news" });

type MyBookMarkProps = {
  items: BookmarkedItem[];
  onLikeToggle: (id: string) => void; // News 좋아요
  onBookmarkToggle: (id: string, type: "post" | "news") => void; // [⭐️]
  onPostLikeToggle: (id: string) => void; // Post 좋아요
};

export default function MyBookMark({
  items,
  onLikeToggle,
  onBookmarkToggle,
  onPostLikeToggle,
}: MyBookMarkProps) {
  if (!items || items.length === 0) {
    return <EmptyActivity message="북마크한 항목이 없습니다" />;
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => {
          if (item.type === "post") {
            return (
              <Post
                key={item.id}
                data={item}
                onLikeToggle={onPostLikeToggle}
                onBookmarkToggle={onBookmarkToggle} // [⭐️] Post 북마크 해제 핸들러
              />
            );
          }

          if (item.type === "news") {
            return (
              <NewsItem
                key={item.id}
                item={item}
                onLikeToggle={onLikeToggle}
                onBookmarkToggle={() => onBookmarkToggle(item.id, "news")} // [⭐️] News 북마크 해제
              />
            );
          }

          return null;
        })}
      </div>
    </>
  );
}