"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import MyPosts from "@/components/profile/MyPosts";
import MyComments from "@/components/profile/MyComments";
import MyBookMark from "@/components/profile/MyBookMark";
import { NewsItemWithState } from "@/types";
import { PostType } from "@/types/Post";
import { Database } from "@/utils/supabase/supabase";

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
  comment_likes?: { user_id: string }[] | null;
  isLiked?: boolean;
};

export type TabKey = "posts" | "comments" | "bookmarks";

const TAB_LABEL: Record<TabKey, string> = {
  posts: "게시글",
  comments: "댓글",
  bookmarks: "북마크",
};

type BookmarkedItem =
  | (PostType & { type: "post" })
  | (NewsItemWithState & { type: "news" });

type ProfileActivityTabsProps = {
  initialTab: TabKey;
  myPosts: PostType[];
  myComments: DbCommentRow[];
  myBookmarks: BookmarkedItem[];
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string, type: "post" | "news") => void;
  onPostLikeToggle: (id: string) => void;
  onCommentLikeToggle: (id: string) => void;
  onPostBookmarkToggle: (id: string) => void;
};

export function ProfileActivityTabs({
  initialTab,
  myPosts,
  myComments,
  myBookmarks,
  onLikeToggle,
  onBookmarkToggle,
  onPostLikeToggle,
  onCommentLikeToggle,
}: // onPostBookmarkToggle,
ProfileActivityTabsProps) {
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
  const activeClass =
    "bg-white text-[#0A0A0A] shadow-sm dark:text-white dark:bg-white/20";
  const inactiveClass = "text-[#9CA3AF] dark:text-[#A6A6DB]";

  return (
    <>
      <div className="bg-white/40 border border-white/20 rounded-xl shadow-xl mt-6 dark:bg-white/20 dark:shadow-white/20">
        <div className="p-1 w-full flex gap-1 leading-none">
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

      <div className="mt-4 lg:mt-6">
        {activeTab === "posts" && (
          <MyPosts posts={myPosts} onLikeToggle={onPostLikeToggle} />
        )}
        {activeTab === "comments" && (
          <MyComments
            comments={myComments}
            onLikeToggle={onCommentLikeToggle}
          />
        )}
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
