"use client";

import { useState } from "react";
import MyPosts from "@/components/profile/MyPosts";
import MyComments from "@/components/profile/MyComments";
import MyBookMark from "@/components/profile/MyBookMark";

type TabKey = "posts" | "comments" | "bookmarks";

const TAB_LABEL: Record<TabKey, string> = {
  posts: "게시글",
  comments: "댓글",
  bookmarks: "북마크",
};

type ProfileActivityTabsProps = {
  posts: Post[];
};

export function ProfileActivityTabs({ posts }: ProfileActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("posts");

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
            onClick={() => setActiveTab("posts")}
          >
            {TAB_LABEL.posts}
          </button>
          <button
            className={`${baseBtn} ${
              activeTab === "comments" ? activeClass : inactiveClass
            }`}
            onClick={() => setActiveTab("comments")}
          >
            {TAB_LABEL.comments}
          </button>
          <button
            className={`${baseBtn} ${
              activeTab === "bookmarks" ? activeClass : inactiveClass
            }`}
            onClick={() => setActiveTab("bookmarks")}
          >
            {TAB_LABEL.bookmarks}
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="mt-4 lg:mt-6">
        {activeTab === "posts" && <MyPosts posts={posts} />}
        {activeTab === "comments" && <MyComments />}
        {activeTab === "bookmarks" && <MyBookMark posts={posts} />}
      </div>
    </>
  );
}
