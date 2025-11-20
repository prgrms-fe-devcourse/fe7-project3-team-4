// src/app/news/[id]/edit/page.tsx
// [기능]: 뉴스 수정 페이지 (서버 컴포넌트 셸)
// - ID에 해당하는 뉴스의 (id, title, content)를 가져와 EditForm에 전달

import { createClient } from "@/utils/supabase/server";
import EditForm from './EditForm' // 클라이언트 폼 컴포넌트

// [리뷰] 상세 페이지와 동일하게 공개 키(anon key)로 클라이언트 생성
// (서버 컴포넌트이므로 Service Key도 가능하지만, 읽기 전용이라 OK)

// 수정에 필요한 최소한의 타입
type NewsItem = {
  id: string
  title: string
  content: string | null
  tags: string[] | null
}

// ✅ [수정] params를 Promise로 받고, paramsPromise로 이름을 변경
export default async function NewsEditPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  // ✅ [수정] await을 사용하여 Promise를 풀고 id를 추출
  const { id } = await paramsPromise
  const supabase = await createClient();

  const { data: newsItem, error } = await supabase
    .from('news')
    .select('id, title, content') // [클린 코드] 수정에 필요한 최소한의 데이터만 select
    .eq('id', id)
    .single<NewsItem>()

  if (error || !newsItem) {
    console.error("Error fetching news for edit:", error?.message);
    return <div className="p-6 text-red-600">수정할 뉴스를 불러올 수 없습니다.</div>
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">기사 수정하기</h1>
      {/* 서버에서 가져온 데이터를 클라이언트 컴포넌트(EditForm)에 props로 전달 */}
      <EditForm newsItem={newsItem} />
    </main>
  )
}