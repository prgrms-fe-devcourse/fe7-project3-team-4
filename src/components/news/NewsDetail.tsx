// components/news/NewsDetail.tsx
"use client";

import { ArrowLeft, Edit } from "lucide-react";
import { NewsItemWithState } from "@/types";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getTranslatedTag } from "@/utils/tagTranslator";
import Link from "next/link";
import DetailActions from "@/app/(home)/news/[id]/DetailActions";
import NewsItemSkeleton from "./NewsItemSkeleton";
import { formatTimeAgo } from "@/utils/formatTimeAgo";

interface NewsDetailProps {
  news: NewsItemWithState;
  onBack: () => void;
}

export default function NewsDetail({ news, onBack }: NewsDetailProps) {
  const supabase = createClient();
  const [contentHtml, setContentHtml] = useState<string>(news.content || "");
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(!news.content);

  // content가 없으면 Supabase에서 별도로 가져오기
  useEffect(() => {
    const fetchContent = async () => {
      if (!news.content) {
        setIsLoadingContent(true);
        const { data, error } = await supabase
          .from("news")
          .select("content")
          .eq("id", news.id)
          .single();

        if (error) {
          console.error("[NewsDetail] Content fetch error:", error);
        } else if (data?.content) {
          setContentHtml(data.content);
        }
        setIsLoadingContent(false);
      }
    };

    fetchContent();
  }, [news.id, news.content, supabase]);

  const author = news.site_name || "Unknown";
  // const displayDate = (news.published_at || news.created_at).slice(0, 10);
  const displayDate = formatTimeAgo(news.published_at || news.created_at);
  const thumb = Array.isArray(news.images) ? news.images[0] : null;
  const tags = news.tags || [];

  let model: "GPT" | "Gemini" | undefined;
  const lowerCaseTags = tags.map((t) => t.toLowerCase());
  if (lowerCaseTags.includes("gpt")) model = "GPT";
  else if (lowerCaseTags.includes("gemini")) model = "Gemini";

  if (isLoadingContent) {
    return <NewsItemSkeleton />
  }

  return (
    <div className="space-y-6 pb-6">
      {/* 뒤로가기 및 수정 버튼 */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="group cursor-pointer flex items-center gap-2 text-[#6758FF] hover:underline"
        >
          <ArrowLeft className="arrow-wiggle" size={20} />
          <span>뒤로</span>
        </button>
        <Link
          href={`/news/${news.id}/edit`}
          className="p-2 cursor-pointer flex items-center gap-2 text-[#6758FF] border border-[#6758FF] rounded-md hover:text-white hover:bg-[#776bff] transition-colors"
        >
          <Edit size={18} />
          {/* <span className="text-sm">수정</span> */}
        </Link>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="p-6 bg-white/40 box-border border-white/50 rounded-xl shadow-xl dark:bg-white/20 dark:border-white/20">
        {/* 작성자 정보 및 모델 뱃지 */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-500 shrink-0 dark:bg-gray-600 dark:text-gray-300">
              {(author[0] || "?").toUpperCase()}
            </div>
            <div className="space-y-1 leading-none">
              <p className="font-medium dark:text-white">{author}</p>
              <p className="text-[#717182] text-sm dark:text-[#A6A6DB]">
                @{author} · {displayDate}
              </p>
            </div>
          </div>
          {model && (
            <div className={`h-[22px] text-xs font-semibold text-white px-3 py-1 rounded-full ${model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"}`}>
              {model}
            </div>
          )}
        </div>

        {/* 제목 */}
        <h1 className="text-[18px] font-semibold mb-6 dark:text-white">{news.title}</h1>

        {/* 썸네일 */}
        {thumb && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-300 mb-6 dark:bg-gray-700">
            <Image src={thumb} alt={news.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        )}

        {/* [✅ 수정] 본문 내용 - 100% 렌더링 보장 */}
        <article className="prose prose-lg max-w-none mb-6 dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>

        {/* 태그 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm text-[#248AFF] mb-6">
            {tags.map((tag, i) => (
              <span key={i}>#{getTranslatedTag(tag)}</span>
            ))}
          </div>
        )}

        {/* 액션 버튼 */}
        <DetailActions
          id={news.id}
          initialLikes={news.like_count ?? 0}
          initialViews={news.view_count ?? 0}
          initialIsLiked={news.isLiked}
          initialIsBookmarked={news.isBookmarked}
        />
      </div>
    </div>
  );
}