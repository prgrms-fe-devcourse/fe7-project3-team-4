// src/components/profile/ProfileActivityTabs.tsx

"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import MyPosts from "@/components/profile/MyPosts";
import MyComments from "@/components/profile/MyComments";
import MyBookMark from "@/components/profile/MyBookMark";
import { NewsItemWithState, Post } from "@/types";
import { Database } from "@/utils/supabase/supabase";

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
};

export type TabKey = "posts" | "comments" | "bookmarks";

const TAB_LABEL: Record<TabKey, string> = {
  posts: "게시글",
  comments: "댓글",
  bookmarks: "북마크",
};

type BookmarkedItem =
  | (Post & { type: "post" })
  | (NewsItemWithState & { type: "news" });

type ProfileActivityTabsProps = {
  initialTab: TabKey;
  myPosts: Post[];
  myComments: DbCommentRow[];
  myBookmarks: BookmarkedItem[];
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string, type: "post" | "news") => void;
  onPostLikeToggle: (id: string) => void;
};

export function ProfileActivityTabs({
  initialTab, 
  myPosts,
  myComments,
  myBookmarks,
  onLikeToggle,
  onBookmarkToggle,
  onPostLikeToggle,
}: ProfileActivityTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as TabKey) || initialTab;

  const handleTabChange = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const baseBtn =
    "cursor-pointer flex-1 py-4 rounded-xl text-sm transition-colors";
  const activeClass = "bg-white text-[#111827] shadow-sm";
  const inactiveClass = "text-[#9CA3AF]";

  return (
    <>
      {/* 탭 버튼 */}
      <div className="bg-white/40 border-white/20 rounded-xl shadow-xl">
        <div className="mt-6 p-1 w-full flex gap-1 leading-none">
          <button
            className={`${baseBtn} ${
              activeTab === "posts" ? activeClass : inactiveClass
            }`}
            onClick={() => handleTabChange("posts")}
          >
            {TAB_LABEL.posts}
          </button>
          <button
            className={`${baseBtn} ${
              activeTab === "comments" ? activeClass : inactiveClass
            }`}
            onClick={() => handleTabChange("comments")}
          >
            {TAB_LABEL.comments}
          </button>
          <button
            className={`${baseBtn} ${
              activeTab === "bookmarks" ? activeClass : inactiveClass
            }`}
            onClick={() => handleTabChange("bookmarks")}
          >
            {TAB_LABEL.bookmarks}
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="mt-4 lg:mt-6">
        {activeTab === "posts" && (
          <MyPosts posts={myPosts} onLikeToggle={onPostLikeToggle} />
        )}
        {activeTab === "comments" && <MyComments comments={myComments} />}
        {activeTab === "bookmarks" && (
          <MyBookMark
            items={myBookmarks}
            onLikeToggle={onLikeToggle}
            onBookmarkToggle={onBookmarkToggle}
            onPostLikeToggle={onPostLikeToggle}
          />
        )}
      </div>
    </>
  );
}