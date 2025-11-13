import Post from "../home/post/Post";
import NewsItem from "../news/NewsItem";
import EmptyActivity from "./EmptyActivity";
import { NewsItemWithState } from "@/types";
import { PostType } from "@/types/Post";

type BookmarkedItem =
  | (PostType & { type: "post" })
  | (NewsItemWithState & { type: "news" });

type MyBookMarkProps = {
  items: BookmarkedItem[];
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string, type: "post" | "news") => void;
  onPostLikeToggle: (id: string) => void;
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
    <div className="space-y-4">
      {items.map((item) => {
        if (item.type === "post") {
          return (
            <Post
              key={item.id}
              data={item}
              onLikeToggle={onPostLikeToggle}
              onBookmarkToggle={onBookmarkToggle}
            />
          );
        }

        if (item.type === "news") {
          return (
            <NewsItem
              key={item.id}
              item={item}
              onLikeToggle={onLikeToggle}
              onBookmarkToggle={() => onBookmarkToggle(item.id, "news")}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
