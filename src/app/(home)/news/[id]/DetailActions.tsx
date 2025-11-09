// src/app/news/[id]/DetailActions.tsx
// [기능]: 뉴스 상세 페이지의 클라이언트 상호작용 (조회수, 좋아요, 북마크)
// [수정] Post.tsx/NewsItem.tsx의 디자인 및 토글 로직 적용

'use client'

import { useEffect, useState } from 'react'
import { createClient } from "@/utils/supabase/client"
import { Heart, Eye, Bookmark } from 'lucide-react' // [수정] 아이콘 임포트

type DetailActionsProps = {
  id: string
  initialLikes: number
  initialViews: number
  initialIsLiked: boolean; // [추가]
  initialIsBookmarked: boolean; // [추가]
}

export default function DetailActions({
  id,
  initialLikes,
  initialViews,
  initialIsLiked,
  initialIsBookmarked
}: DetailActionsProps) {
  const supabase = createClient();

  // [수정] 모든 상태를 useState로 관리
  const [likes, setLikes] = useState(initialLikes)
  const [views, setViews] = useState(initialViews)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)

  const [liking, setLiking] = useState(false) // 좋아요 중복 클릭 방지
  const [bookmarking, setBookmarking] = useState(false) // 북마크 중복 클릭 방지
  
  const [hasViewed, setHasViewed] = useState(false)

  // 조회수 자동 증가 (첫 렌더링 시 1회)
  useEffect(() => {
    let mounted = true
    
    const incView = async () => {
      try {
        if (hasViewed) return 
        setHasViewed(true) 
        
        setViews(v => v + 1) // 1. 낙관적 업데이트
        
        await supabase.rpc('news_increment_view', { p_id: id })
      
      } catch (err) {
        console.error("View increment failed:", err);
        if (mounted) setViews(v => Math.max(0, v - 1))
      }
    }
    
    incView()
    
    return () => { mounted = false }
  }, [id, hasViewed]) // [수정] 의존성 배열에 supabase 제거 (무한 루프 방지)

  // [추가] 좋아요 토글 (useNewsFeed.ts 로직 참고)
  const handleLikeToggle = async () => {
    if (liking) return;
    setLiking(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      setLiking(false);
      return;
    }

    // 1. 옵티미스틱 UI
    const currentlyLiked = isLiked;
    const currentLikes = likes;
    
    setIsLiked(!currentlyLiked);
    setLikes(!currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1));

    try {
      if (currentlyLiked) {
        // 좋아요 취소 (DELETE)
        const { error } = await supabase
          .from("user_news_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", id);
        if (error) throw error;
      } else {
        // 좋아요 (INSERT)
        const { error } = await supabase
          .from("user_news_likes")
          .insert({ user_id: user.id, news_id: id });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("[LikeToggle Error]", err.message);
      // 4. 롤백
      setIsLiked(currentlyLiked);
      setLikes(currentLikes);
    } finally {
      setLiking(false);
    }
  };

  // [추가] 북마크 토글 (useNewsFeed.ts 로직 참고)
  const handleBookmarkToggle = async () => {
    if (bookmarking) return;
    setBookmarking(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      setBookmarking(false);
      return;
    }

    // 1. 옵티미스틱 UI
    const currentlyBookmarked = isBookmarked;
    setIsBookmarked(!currentlyBookmarked);

    try {
      if (currentlyBookmarked) {
        // 북마크 취소 (DELETE)
        const { error } = await supabase
          .from("user_news_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", id);
        if (error) throw error;
      } else {
        // 북마크 (INSERT)
        const { error } = await supabase
          .from("user_news_bookmarks")
          .insert({ user_id: user.id, news_id: id });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("[BookmarkToggle Error]", err.message);
      // 4. 롤백
      setIsBookmarked(currentlyBookmarked);
    } finally {
      setBookmarking(false);
    }
  };


  // [수정] Post.tsx/NewsItem.tsx의 버튼 스타일 적용
  return (
    <div className="flex justify-center gap-30 text-[#717182] py-6">
      <button
        onClick={handleLikeToggle}
        disabled={liking}
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          isLiked
            ? "text-[#FF569B] bg-[#F7E6ED]"
            : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
        }`}
        aria-pressed={isLiked}
        aria-label="좋아요"
      >
        <div className="flex gap-2 text-sm items-center ">
          <Heart size={18} />
          <span className="font-semibold">{likes}</span>
        </div>
      </button>

      <span
        className="cursor-pointer py-1 px-2 rounded-md"
        aria-label="조회수"
      >
        <div className="flex gap-2 text-sm items-center">
          <Eye size={18} />
          <span className="font-semibold">{views}</span>
        </div>
      </span>

      <button
        onClick={handleBookmarkToggle}
        disabled={bookmarking}
        className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
          isBookmarked
            ? "text-[#6758FF] bg-[#D8D4FF]"
            : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
        }`}
        aria-pressed={isBookmarked}
        aria-label="북마크"
      >
        <Bookmark size={18} />
      </button>
    </div>
  )
}