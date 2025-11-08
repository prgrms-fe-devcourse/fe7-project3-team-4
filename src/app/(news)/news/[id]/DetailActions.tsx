// src/app/news/[id]/DetailActions.tsx
// [기능]: 뉴스 상세 페이지의 클라이언트 상호작용 (조회수, 좋아요)
// - 페이지 첫 로드 시 조회수(view) 1 증가 (RPC 호출)
// - '좋아요' 버튼 클릭 시 좋아요(like) 1 증가 (RPC 호출)
// [리뷰]: (좋은 패턴 👍)
// 상세 페이지(서버 컴포넌트)에서 좋아요/조회수 같은 동적 상호작용을
// 별도의 클라이언트 컴포넌트로 분리했습니다.

'use client'

import { useEffect, useState } from 'react'
// [통합] 임포트 경로 수정
import { createClient } from "@/utils/supabase/client"


type DetailActionsProps = {
  id: string
  initialLikes: number
  initialViews: number
}

export default function DetailActions({
  id,
  initialLikes,
  initialViews
}: DetailActionsProps) {
  const supabase = createClient();

  const [likes, setLikes] = useState(initialLikes)
  const [views, setViews] = useState(initialViews)
  const [liking, setLiking] = useState(false)
  
  // [클린 코드] 조회수 중복 증가 방지 플래그
  const [hasViewed, setHasViewed] = useState(false)

  // 조회수 자동 증가 (첫 렌더링 시 1회)
  useEffect(() => {
    let mounted = true
    
    const incView = async () => {
      try {
        if (hasViewed) return // 이미 조회수 증가 RPC를 호출했으면 중지
        setHasViewed(true) // [클린 코드] 플래그 설정
        
        setViews(v => v + 1) // 1. 낙관적 업데이트 (UI 즉시 반영)
        
        // 2. DB에 RPC 호출
        await supabase.rpc('news_increment_view', { p_id: id })
      
      } catch (err) {
        // 3. 실패 시 롤백
        console.error("View increment failed:", err);
        if (mounted) setViews(v => Math.max(0, v - 1))
      }
    }
    
    // 컴포넌트가 마운트되면 조회수 증가 시도
    incView()
    
    return () => { mounted = false }
  }, [id, hasViewed]) // [클린 코드] hasViewed를 의존성에 추가

  // 좋아요 버튼
  const handleLike = async () => {
    if (liking) return // 중복 클릭 방지
    setLiking(true)
    
    setLikes(l => l + 1) // 1. 낙관적 업데이트
    
    try {
      // 2. DB에 RPC 호출
      await supabase.rpc('news_increment_like', { p_id: id })
    
    } catch (err) {
      // 3. 실패 시 롤백
      console.error("Like increment failed:", err);
      setLikes(l => Math.max(0, l - 1)) 
    
    } finally {
      setLiking(false)
    }
  }

  return (
    <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
      <span aria-label="조회수">👁 {views}</span>
      <button
        onClick={handleLike}
        disabled={liking}
        className="inline-flex items-center gap-2 bg-pink-600 text-white px-3 py-1.5 rounded hover:bg-pink-700 disabled:opacity-60 transition-colors"
        aria-label="좋아요 버튼"
      >
        ❤️ 좋아요
        <span className="font-semibold">{likes}</span>
      </button>
    </div>
  )
}