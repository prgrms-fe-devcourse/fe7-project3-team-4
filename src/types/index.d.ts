// src/types/index.d.ts
// [통합]: src_login과 src_news의 타입 병합

import { Database } from "@/utils/supabase/supabase";

// --- 기존 src_login 타입 ---
export type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Hashtag = Database["public"]["Tables"]["hashtags"]["Row"];

export type MainDetail = Post & {
  profiles: Profile;
};

export type PostDetail = Post & {
  profiles: Profile;
} & {
  comments: Comment[];
};
export type FormState = {
  success: boolean;
  error: string | null;
};

// --- [추가] src_news/lib/types.ts ---

/**
 * 뉴스 정렬 기준 (최신순, 인기순, 조회순)
 */
export type SortKey = "published_at" | "like_count" | "view_count";

/**
 * Supabase 'news' 테이블의 기본 행 타입 (주요 필드)
 */
export type NewsRow = {
  id: string;
  title: string;
  site_name: string | null;
  created_at: string; // DB 생성 시간
  published_at: string | null; // 기사 원본 발행 시간
  images: string[] | null; // 썸네일 이미지 (배열)
  like_count?: number | null;
  view_count?: number | null;
  tags: string[] | null; // [신규] 태그 배열 추가
};

/**
 * 클라이언트(피드)에서 사용되는 뉴스 아이템 타입
 * NewsRow에 isLiked, isBookmarked UI 상태를 추가
 */
export type NewsItemWithState = NewsRow & {
  isLiked: boolean; // 현재 사용자의 좋아요 여부 (UI 상태)
  isBookmarked: boolean; // 현재 사용자의 북마크 여부 (UI 상태)
};
