// src/app/news/[id]/page.tsx
// [기능]: 뉴스 상세 페이지 (서버 컴포넌트)
// - URL 파라미터(id)에 해당하는 뉴스를 Supabase에서 조회
// - [수정] PostDetail.tsx와 유사한 레이아웃 적용
// - [수정] 사용자의 좋아요/북마크 상태를 함께 조회

import { createClient } from "@/utils/supabase/server";
import DetailActions from "./DetailActions"; // [수정] 기능이 확장된 DetailActions
import Link from "next/link";
import Image from "next/image"; // [수정] Image 임포트
import { NewsRow } from "@/types";
import { getTranslatedTag } from "@/utils/tagTranslator"; // [✅ 추가] 임포트

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

// [수정] Join을 위한 타입 확장
type NewsItem = NewsRow & {
  id: string;
  title: string;
  content: string | null;
  site_name: string | null;
  url?: string | null;
  published_at: string | null;
  created_at: string;
  images: string[] | null;
  videos: string[] | null;
  audios: string[] | null;
  metadata: {
    metascraper?: MetascraperData | null;
    jsonld?: {
      // [수정] 'any' 대신 사용되는 필드만 타입 정의
      author?: { name?: string } | string | null;
      [key: string]: unknown; // 나머지 속성은 'unknown'
    } | null;
    readability?: unknown; // [수정] 'any' 대신 'unknown'
    media_positions?: {
      type: "video" | "audio" | "image";
      url: string;
      afterParagraphIndex: number;
    }[];
  } | null;
  like_count?: number | null;
  view_count?: number | null;
  tags: string[] | null; // [수정] tags 필드 추가
  // [추가] Join된 테이블 타입
  user_news_likes: { user_id: string }[];
  user_news_bookmarks: { user_id: string }[];
};

// [삭제] 기존 formatDate 헬퍼 (Post.tsx의 .slice(0, 10) 방식 사용)
// const formatDate = (iso?: string | null) => { ... }

export default async function NewsDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  const supabase = await createClient();

  // [추가] 현재 사용자 ID 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const { data: newsItem, error } = await supabase
    .from("news")
    // [수정] useNewsFeed.ts와 동일하게 Join 및 필드 선택
    .select(
      `
      id, title, content, site_name, url, published_at, created_at, metadata, 
      like_count, view_count, tags, images,
      user_news_likes!left(user_id),
      user_news_bookmarks!left(user_id)
    `
    )
    // [추가] Join 필터링
    .filter(
      "user_news_likes.user_id",
      "eq",
      userId || "00000000-0000-0000-0000-000000000000"
    )
    .filter(
      "user_news_bookmarks.user_id",
      "eq",
      userId || "00000000-0000-0000-0000-000000000000"
    )
    .eq("id", id)
    .single<NewsItem>();

  if (error || !newsItem) {
    console.error("Error fetching news:", error?.message);
    return <div className="p-6 text-red-600">뉴스를 불러올 수 없습니다.</div>;
  }

  // [추가] Join된 배열로 초기 상태 계산
  const initialIsLiked = newsItem.user_news_likes.length > 0;
  const initialIsBookmarked = newsItem.user_news_bookmarks.length > 0;

  const contentHtml = newsItem.content || "";
  const tags = newsItem.tags || [];

  // [수정] Post.tsx와 동일하게 yyyy-MM-dd 형식 사용
  const displayDate = (newsItem.published_at ?? newsItem.created_at).slice(
    0,
    10
  );

  const author =
    newsItem.metadata?.metascraper?.author ??
    (typeof newsItem.metadata?.jsonld?.author === "string" // 1. string인지 먼저 확인
      ? newsItem.metadata.jsonld.author // 2. string이면, 그 값을 그대로 사용
      : newsItem.metadata?.jsonld?.author?.name) ?? // 3. string이 아니면(객체, null), .name에 접근
    newsItem.site_name ??
    "Unknown";

  // [추가] NewsItem.tsx의 뱃지 로직 적용
  let model: "GPT" | "Gemini" | undefined = undefined;
  const lowerCaseTags = tags.map((t) => t.toLowerCase());
  if (lowerCaseTags.includes("gpt")) {
    model = "GPT";
  } else if (lowerCaseTags.includes("gemini")) {
    model = "Gemini";
  }

  // [추가] 썸네일 이미지
  const thumb = Array.isArray(newsItem.images) ? newsItem.images[0] : null;

  return (
    // [수정] PostDetail과 동일한 컨테이너 스타일 적용 (이전 단계에서 적용됨)
    <main className="max-w-2xl mx-auto p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl">
      {/* 수정하기 버튼 (기존 위치 유지) */}
      <div className="mb-4 text-right">
        <Link
          href={`/news/${newsItem.id}/edit`}
          className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          ✏️ 수정하기
        </Link>
      </div>

      {/* [수정] PostDetail.tsx 레이아웃 적용 */}

      {/* 1. 작성자 정보 */}
      <div className="flex justify-between">
        <div className="flex gap-3 items-center">
          {/* 프로필 이미지 (임시) */}
          <div className="w-11 h-11 bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-500 shrink-0">
            {(author[0] || "?").toUpperCase()}
          </div>
          {/* 이름, 이메일, 작성 시간 */}
          <div className="space-y-1 leading-none">
            <p>{author}</p>
            <p className="text-[#717182] text-sm">
              {newsItem.site_name} · {displayDate}
            </p>
          </div>
        </div>
        {/* 2. 모델 뱃지 */}
        {model && (
          <div
            className={`h-[22px] text-xs font-semibold text-white px-3 py-1 ${
              model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
            } rounded-full`}
          >
            {model}
          </div>
        )}
      </div>

      {/* 3. 게시글 내용 */}
      <div className="my-5">
        {/* 제목 */}
        <div className="mb-6 space-y-4">
          <div className="text-[18px] font-semibold">{newsItem.title}</div>
        </div>

        {/* 썸네일(이미지) - [수정됨] */}
        {thumb && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-300 mb-6">
            <Image
              src={thumb}
              alt={newsItem.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {/* 본문 (Readability가 추출한 HTML) */}
        <article className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>
      </div>

      {/* 4. 태그들 */}
      {tags.length > 0 && (
        <div className="space-x-2 text-sm text-[#248AFF]">
          {tags.map((tag, i) => (
            <span key={i}>#{getTranslatedTag(tag)}</span> // [✅ 수정]
          ))}
        </div>
      )}

      {/* 5. 좋아요/조회수/북마크 (클라이언트 컴포넌트) */}
      <DetailActions
        id={newsItem.id}
        initialLikes={newsItem.like_count ?? 0}
        initialViews={newsItem.view_count ?? 0}
        initialIsLiked={initialIsLiked}
        initialIsBookmarked={initialIsBookmarked}
      />
    </main>
  );
}