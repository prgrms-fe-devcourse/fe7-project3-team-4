// src/app/news/[id]/page.tsx
// [기능]: 뉴스 상세 페이지 (서버 컴포넌트)
// - URL 파라미터(id)에 해당하는 뉴스를 Supabase에서 조회
// - [리팩토링 제안] 미디어 삽입 로직(injectByPositions) 제거

import { createClient } from "@/utils/supabase/server"; // [통합] 서버 클라이언트 사용
import DetailActions from './DetailActions';
import Link from 'next/link';
import { NewsRow } from "@/types"; // [통합] 타입 임포트 경로 수정
// [리뷰] 서버 컴포넌트이므로 Anon Key/Service Key 모두 사용 가능 (읽기라 Anon Key 사용)

interface MetascraperData {
  author?: string;
  date?: string;
  description?: string;
  image?: string;
  logo?: string;
  publisher?: string;
  title?: string;
  url?: string;
  lang?: string;
  iframe?: string;
  video?: string;
}

// [리뷰] DB 스키마와 일치하는 상세한 타입 정의 (좋습니다)
type NewsItem = NewsRow & {
  id: string
  title: string
  content: string | null
  site_name: string | null
  url?: string | null
  published_at: string | null
  created_at: string
  images: string[] | null
  videos: string[] | null
  audios: string[] | null
  metadata: {
    metascraper?: MetascraperData | null
    jsonld?: any
    readability?: any
    // [리뷰] 이 타입이 사용되지만, api/parse에서는 항상 빈 배열을 저장합니다.
    media_positions?: { type: 'video'|'audio'|'image'; url: string; afterParagraphIndex: number }[]
  } | null
  like_count?: number | null
  view_count?: number | null
}

// 날짜 포매팅 헬퍼
const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(+d) ? String(iso) : d.toLocaleString()
}
// [리팩토링] injectByPositions 제거로 불필요
// const toAbs = (u: string, base: string) => { try { return new URL(u, base).toString() } catch { return u } }

// [리팩토링] 
// 이 함수(injectByPositions)는 /api/parse/route.ts에서
// 'media_positions'를 항상 빈 배열 '[]'로 저장하도록 수정되었기 때문에
// 사실상 아무 기능도 하지 않는 '데드 코드(Dead Code)'입니다. (주요 제안 2번 참고)
// 따라서 이 함수와 관련 로직을 제거하는 것이 좋습니다.
/*
function injectByPositions(contentHtml: string, baseUrl: string, positions: NewsItem['metadata']['media_positions']) {
  // ... (기존 로직) ...
  // [리팩토링] 이 함수 전체가 데드 코드이므로 삭제
  return body.innerHTML
}
*/

// ✅ Next.js 16 (App Router)에서 동적 파라미터를 받는 서버 컴포넌트
export default async function NewsDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  // ✅ Promise를 await으로 풀어 id 추출
  const { id } = await paramsPromise
  const supabase = await createClient();

  const { data: newsItem, error } = await supabase
    .from('news')
    // [클린 코드] 필요한 모든 필드 선택
    .select('id, title, content, site_name, url, published_at, created_at, metadata, like_count, view_count') 
    .eq('id', id)
    .single<NewsItem>()

  if (error || !newsItem) {
    console.error("Error fetching news:", error?.message);
    return <div className="p-6 text-red-600">뉴스를 불러올 수 없습니다.</div>
  }

  // [리팩토링] injectByPositions 함수가 제거되었으므로,
  // 'contentWithMedia'는 원본 content와 동일합니다.
  const contentHtml = newsItem.content || '';

  // 메타데이터에서 작성자, 날짜 등 추출
  // const baseUrl = newsItem.metadata?.metascraper?.url || newsItem.url || 'https://example.com/'
  const displayDate = newsItem.published_at ?? newsItem.created_at
  const author =
    newsItem.metadata?.metascraper?.author ??
    newsItem.metadata?.jsonld?.author?.name ??
    // [클린 코드] author가 객체일 수 있으므로 string만 처리
    (typeof newsItem.metadata?.jsonld?.author === 'string' ? newsItem.metadata.jsonld.author : null) ??
    newsItem.site_name ??
    'Unknown'


  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="mb-4 text-right">
        {/* 수정하기 페이지로 이동 */}
        <Link 
          href={`/news/${newsItem.id}/edit`} 
          className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          ✏️ 수정하기
        </Link>
      </div>
      
      {/* [클린 코드] Tailwind @tailwindcss/typography 플러그인 사용 
        (globals.css에 @tailwind typography; 추가 필요)
      */}
      <article className="prose prose-lg max-w-none">
        {/* 제목 */}
        <h1>{newsItem.title}</h1>
        
        {/* 메타 정보 */}
        <div className="text-sm text-gray-500 -mt-3">
          <span>{formatDate(displayDate)}</span>
          <span className="mx-2">|</span>
          <span className="font-medium">작성자</span>: {author}
        </div>
        
        {/* 본문 (Readability가 추출한 HTML) 
          [리팩토링] contentWithMedia 대신 contentHtml(원본)을 바로 사용
        */}
        <div className="mt-4" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </article>

      {/* 조회/좋아요 & 액션 (클라이언트 컴포넌트) */}
      <DetailActions
        id={newsItem.id}
        initialLikes={newsItem.like_count ?? 0}
        initialViews={newsItem.view_count ?? 0}
      />
    </main>
  )
}