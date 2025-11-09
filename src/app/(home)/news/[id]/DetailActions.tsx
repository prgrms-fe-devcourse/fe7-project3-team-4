// src/app/news/[id]/DetailActions.tsx
'use client'

import { useEffect, useState, useCallback } from 'react' // [수정] useCallback 임포트
import { createClient } from "@/utils/supabase/client"
import { Heart, Eye, Bookmark } from 'lucide-react'

type DetailActionsProps = {
  id: string
  initialLikes: number
  initialViews: number
  initialIsLiked: boolean;
  initialIsBookmarked: boolean;
}

export default function DetailActions({
  id,
  initialLikes,
  initialViews,
  initialIsLiked,
  initialIsBookmarked
}: DetailActionsProps) {
  // [수정] 1. useState를 사용해 Supabase 클라이언트를 한 번만 생성 (안정화)
  const [supabase] = useState(() => createClient());

  const [likes, setLikes] = useState(initialLikes)
  const [views, setViews] = useState(initialViews)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)

  const [liking, setLiking] = useState(false)
  const [bookmarking, setBookmarking] = useState(false) 
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
      
      } catch (err: unknown) { // [수정] 4. any -> unknown
        console.error("View increment failed:", err instanceof Error ? err.message : JSON.stringify(err));
        if (mounted) setViews(v => Math.max(0, v - 1))
      }
    }
    
    incView()
    
    return () => { mounted = false }
  }, [id, hasViewed, supabase]) // [수정] 2. 안정화된 supabase 의존성 추가

  // [수정] 3. useCallback 래핑
  const handleLikeToggle = useCallback(async () => {
    if (liking) return;
    setLiking(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      setLiking(false);
      return;
    }

    const currentlyLiked = isLiked;
    const currentLikes = likes;
    
    setIsLiked(!currentlyLiked);
    setLikes(!currentlyLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1));

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from("user_news_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_news_likes")
          .insert({ user_id: user.id, news_id: id });
        if (error) throw error;
      }
    } catch (err: unknown) { // [수정] 4. any -> unknown
      console.error("[LikeToggle Error]", err instanceof Error ? err.message : JSON.stringify(err));
      // 롤백
      setIsLiked(currentlyLiked);
      setLikes(currentLikes);
    } finally {
      setLiking(false);
    }
  }, [liking, supabase, isLiked, likes, id]); // [수정] 3. 의존성 배열 추가

  // [수정] 3. useCallback 래핑
  const handleBookmarkToggle = useCallback(async () => {
    if (bookmarking) return;
    setBookmarking(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      setBookmarking(false);
      return;
    }

    const currentlyBookmarked = isBookmarked;
    setIsBookmarked(!currentlyBookmarked);

    try {
      if (currentlyBookmarked) {
        const { error } = await supabase
          .from("user_news_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_news_bookmarks")
          .insert({ user_id: user.id, news_id: id });
        if (error) throw error;
      }
    } catch (err: unknown) { // [수정] 4. any -> unknown
      console.error("[BookmarkToggle Error]", err instanceof Error ? err.message : JSON.stringify(err));
      // 롤백
      setIsBookmarked(currentlyBookmarked);
    } finally {
      setBookmarking(false);
    }
  }, [bookmarking, supabase, isBookmarked, id]); // [수S정] 3. 의존성 배열 추가


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