// src/app/api/news/[id]/route.ts
// [기능]: 특정 뉴스 수정 API (PATCH)
// - ID에 해당하는 뉴스의 title, content를 업데이트
// - (Service Key 사용)

import { NextResponse } from 'next/server'
// [통합] supabase-js에서 직접 createClient 임포트
import { createClient } from "@supabase/supabase-js"; 

// [통합] Service Key를 사용하는 클라이언트 생성
// (환경 변수에 SUPABASE_SERVICE_KEY가 설정되어 있어야 함)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! 
);

// PATCH /api/news/[id]
export async function PATCH(
  req: Request,
  // ✅ [수정] App Router에서 동적 파라미터를 받는 방식
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ [수정] await을 사용하여 Promise를 풀고 id를 추출합니다.
    const { id } = await paramsPromise
    
    const body = await req.json()
    const { title, content, tags } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID가 필요합니다.' }, { status: 400 })
    }

    // title 또는 content가 전송된 경우에만 업데이트
    // [클린 코드] 업데이트할 데이터 객체
    const updateData: { title?: string; content?: string; tags?: string[]; } = {}
    
    // [클린 코드] 타입 체크를 통해 안전하게 할당
    if (typeof title === 'string') {
      updateData.title = title
    }
    if (typeof content === 'string') {
      updateData.content = content
    }

    if (Array.isArray(tags)) {
      updateData.tags = tags
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: '수정할 데이터가 없습니다.' }, { status: 400 })
    }

    // [리뷰] .single()이 제거된 상태 (좋습니다. PATCH는 1개만 수정)
    const { error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', id) // [클린 코드] .eq()로 대상 명시

    if (error) {
      console.error("Supabase PATCH error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id })

  } catch (e: unknown) {
    console.error("API PATCH Error:", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : '서버 에러' },
      { status: 500 }
    )
  }
}