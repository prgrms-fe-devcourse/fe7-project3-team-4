import { Sparkles } from "lucide-react";
import Tag from "./Tag";
import Box from "../Box";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

const TAG_LABEL_MAP: Record<string, string> = {
  education: "교육",
  writing: "글쓰기",
  business: "비즈니스",
  script: "스크립트",
  marketing: "마케팅",
  content: "콘텐츠",
  research: "조사",
  play: "놀이",
  sns: "SNS",
  art: "디자인",
  develop: "개발",
  summary: "요약",
};

export default async function Tags() {
  const supabase = await createClient();

  // posts 테이블에서 hashtags와 view_count만 선택
  const { data: posts, error } = await supabase
    .from("posts")
    .select("hashtags, view_count");

  // 데이터 가공 (합산)
  const tagViewCounts = new Map<string, number>();

  if (posts) {
    // 모든 포스트를 순회
    for (const post of posts) {
      // S각 포스트의 해시태그 배열을 순회
      if (post.hashtags) {
        for (const tag of post.hashtags) {
          // 맵(Map)에 태그별로 view_count를 누적 합산
          const currentViews = tagViewCounts.get(tag) || 0;
          const postViews = post.view_count || 0;
          tagViewCounts.set(tag, currentViews + postViews);
        }
      }
    }
  }

  const sortedTags = Array.from(tagViewCounts.entries());
  // 조회수(b[1]) 기준으로 내림차순 정렬
  sortedTags.sort((a, b) => b[1] - a[1]);
  // 상위 8개만 선택
  const topTags = sortedTags.slice(0, 8);

  return (
    <>
      <Box height="372px" icon={<Sparkles />} title="인기 태그들">
        {/* 에러 처리 및 로딩 상태 (간단히) */}
        {error && <p className="text-red-500">태그 로딩 실패</p>}
        {!error && topTags.length === 0 && <p>태그 없음</p>}

        <div className="grid grid-cols-2 grid-rows-4 gap-1">
          {topTags.map(([tagKey, views], index) => {
            // 7-1. DB의 영문 key(tagKey)를 한글 label로 변환
            const label = TAG_LABEL_MAP[tagKey] ?? tagKey;

            return (
              <Link
                href={`/search?tag=${tagKey}`}
                key={tagKey}
                className="transition-transform duration-200 ease-out hover:scale-105"
              >
                <Tag index={index + 1} hashtag={label} views={views} />
              </Link>
            );
          })}
        </div>
      </Box>
    </>
  );
}
