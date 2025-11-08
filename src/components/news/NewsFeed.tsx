"use client";

import { NewsItemWithState } from "@/types";
import NewsItem from "./NewsItem";
import NewsItemSkeleton from "./NewsItemSkeleton"; 

type NewsFeedProps = {
  newsList: NewsItemWithState[];
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  isLoading: boolean; 
};


export default function NewsFeed({
  newsList,
  onLikeToggle,
  onBookmarkToggle,
  isLoading, // [수정] 1번
}: NewsFeedProps) {

  if (isLoading) {
    return (
      <ul className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <li key={i}>
            <NewsItemSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-6">
      {newsList.map((item) => (
        <li key={item.id}> 
          <NewsItem
            item={item}
            onLikeToggle={onLikeToggle}
            onBookmarkToggle={onBookmarkToggle}
          />
        </li>
      ))}
    </ul>
  );
}