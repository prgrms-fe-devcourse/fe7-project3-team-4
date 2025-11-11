// src/components/profile/ProfileActivityTabs.tsx

"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import MyPosts from "@/components/profile/MyPosts";
import MyComments from "@/components/profile/MyComments";
import MyBookMark from "@/components/profile/MyBookMark";
import { NewsItemWithState } from "@/types";
import { PostType } from "@/types/Post"; // [수정] PostType import 추가
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

// [수정] PostType 사용
type BookmarkedItem =
  | (PostType & { type: "post" })
  | (NewsItemWithState & { type: "news" });

type ProfileActivityTabsProps = {
  initialTab: TabKey;
  myPosts: PostType[]; // [수정] Post → PostType
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as TabKey) || initialTab;

  const createTabHref = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    return `${pathname}?${params.toString()}`;
  };

  const baseBtn =
    "cursor-pointer flex-1 py-4 rounded-xl text-sm transition-colors text-center";
  const activeClass = "bg-white text-[#111827] shadow-sm";
  const inactiveClass = "text-[#9CA3AF]";

  return (
    <>
      {/* 탭 버튼 */}
      <div className="bg-white/40 border-white/20 rounded-xl shadow-xl">
        <div className="mt-6 p-1 w-full flex gap-1 leading-none">
          <Link
            href={createTabHref("posts")}
            scroll={false}
            className={`${baseBtn} ${
              activeTab === "posts" ? activeClass : inactiveClass
            }`}
          >
            {TAB_LABEL.posts}
          </Link>
          <Link
            href={createTabHref("comments")}
            scroll={false}
            className={`${baseBtn} ${
              activeTab === "comments" ? activeClass : inactiveClass
            }`}
          >
            {TAB_LABEL.comments}
          </Link>
          <Link
            href={createTabHref("bookmarks")}
            scroll={false}
            className={`${baseBtn} ${
              activeTab === "bookmarks" ? activeClass : inactiveClass
            }`}
          >
            {TAB_LABEL.bookmarks}
          </Link>
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