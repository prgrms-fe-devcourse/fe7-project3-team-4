// src/components/profile/ProfilePageClient.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ProfileActivityTabs,
  TabKey,
} from "@/components/profile/ProfileActivityTabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ImgEditModal } from "./ImgEditModal";
import {
  FormState,
  NewsItemWithState,
  NewsRow,
  Post,
  Profile,
} from "@/types";
import { useNewsFeedContext } from "@/context/NewsFeedContext";
import { Database } from "@/utils/supabase/supabase";

type DbCommentRow = Database["public"]["Tables"]["comments"]["Row"] & {
  content: string | null;
  like_count: number | null;
  reply_count: number | null;
};

type BookmarkedNewsRow = NewsRow & {
  user_news_likes: { user_id: string }[] | null;
};

type BookmarkedItem =
  | (Post & { type: "post" })
  | (NewsItemWithState & { type: "news" });

type ProfilePageClientProps = {
  profile: Profile;
  initialTab: string;
  updateProfile: (prevState: FormState, formData: FormData) => Promise<FormState>;
  updateAvatarUrl: (url: string) => Promise<FormState>;
  togglePostBookmark: (
    postId: string,
    currentUserId: string,
    isBookmarked: boolean
  ) => Promise<FormState>;
  initialMyPosts: Post[];
  initialBookmarkedPosts: Post[];
  initialBookmarkedNews: BookmarkedNewsRow[];
  initialMyComments: DbCommentRow[];
};

export default function ProfilePageClient({
  profile,
  initialTab,
  updateProfile,
  updateAvatarUrl,
  togglePostBookmark,
  initialMyPosts,
  initialBookmarkedPosts,
  initialBookmarkedNews,
  initialMyComments,
}: ProfilePageClientProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditImgOpen, setIsEditImgOpen] = useState(false);

  const {
    handleLikeToggle: handleNewsLikeToggle,
    handleBookmarkToggle: handleNewsBookmarkToggle,
  } = useNewsFeedContext();

  const initialBookmarks = useMemo(() => {
    const posts: BookmarkedItem[] = initialBookmarkedPosts.map((p) => ({
      ...p,
      isBookmarked: true,
      type: "post",
    }));

    const news: BookmarkedItem[] = initialBookmarkedNews.map((n) => ({
      ...n,
      isLiked: !!(n.user_news_likes && n.user_news_likes.length > 0),
      isBookmarked: true,
      type: "news",
    }));

    return [...posts, ...news].sort((a, b) => {
      const dateA =
        a.type === "news"
          ? (a as NewsItemWithState).published_at
          : a.created_at;
      const dateB =
        b.type === "news"
          ? (b as NewsItemWithState).published_at
          : b.created_at;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      return timeB - timeA;
    });
  }, [initialBookmarkedPosts, initialBookmarkedNews]);

  const [myPosts] = useState(initialMyPosts);
  const [myBookmarks, setMyBookmarks] = useState(initialBookmarks);
  const [myComments] = useState(initialMyComments);

  const handleProfileBookmarkToggle = useCallback(
    async (id: string, type: "post" | "news") => {
      if (!profile) return;

      setMyBookmarks((prev) => prev.filter((item) => item.id !== id));

      if (type === "news") {
        await handleNewsBookmarkToggle(id);
      } else {
        const result = await togglePostBookmark(id, profile.id, true);
        if (!result.success) {
          alert(`포스트 북마크 해제 실패: ${result.error}`);
          setMyBookmarks(initialBookmarks);
        }
      }
    },
    [profile, handleNewsBookmarkToggle, togglePostBookmark, initialBookmarks]
  );
  
  const handlePostLikeToggle = useCallback(async (id: string) => {
      alert(`Post 좋아요 기능 미구현 (ID: ${id})`);
  }, []);

  const handleProfileNewsLikeToggle = useCallback(async (id: string) => {
    setMyBookmarks(prevBookmarks => 
        prevBookmarks.map(item => {
            if (item.id === id && item.type === 'news') {
                const isCurrentlyLiked = (item as NewsItemWithState).isLiked;
                const currentLikes = (item as NewsItemWithState).like_count ?? 0;
                
                return {
                    ...item,
                    isLiked: !isCurrentlyLiked,
                    like_count: !isCurrentlyLiked 
                        ? currentLikes + 1 
                        : Math.max(0, currentLikes - 1)
                };
            }
            return item;
        })
    );

    try {
      await handleNewsLikeToggle(id);
    } catch (error) {
      console.error("Profile like toggle DB update failed:", error);
    }
  }, [handleNewsLikeToggle, setMyBookmarks]);

  return (
    <>
      <div className="relative">
        <ProfileHeader
          profile={profile}
          onAvatarClick={() => setIsEditImgOpen(true)}
          onEditClick={() => setIsEditProfileOpen(true)}
        />
        <ProfileActivityTabs
          initialTab={initialTab as TabKey}
          myPosts={myPosts}
          myComments={myComments}
          myBookmarks={myBookmarks}
          onLikeToggle={handleProfileNewsLikeToggle}
          onBookmarkToggle={handleProfileBookmarkToggle}
          onPostLikeToggle={handlePostLikeToggle}
        />
      </div>

      <ProfileEditModal
        profile={profile}
        action={updateProfile}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <ImgEditModal
        profile={profile}
        action={updateAvatarUrl}
        isOpen={isEditImgOpen}
        onClose={() => setIsEditImgOpen(false)}
      />
    </>
  );
}