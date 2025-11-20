import { Json } from "@/utils/supabase/supabase";
export interface PostType {
  id: string;
  user_id: string;
  title: string;
  content: Json | null;
  created_at: string;
  post_type: string;
  hashtags?: string[];
  like_count: number;
  comment_count: number;
  view_count: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  model?: string;
  thumbnail?: string | null;
  subtitle?: string | null;
  result_mode?: string | null;
  profiles?: {
    display_name: string | null;
    email: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    equipped_badge_id?: string | null;
  };
}

// WeeklyModel 타입 정의
export type WeeklyModel = "Text" | "Image";

// WeeklyPostType 예시 (PostType 확장 + 추가 필드)
export interface WeeklyPostType extends PostType {
  model?: WeeklyModel;
  user_id: string;
  // profiles 테이블에서 조회한 데이터
  profiles?: {
    display_name: string | null;
    email: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    equipped_badge_id?: string | null;
  };
}

type PromptModel = "GPT" | "Gemini";

// 조회 내역 페이지를 위한 타입
// (user_post_views 테이블과 posts 테이블을 JOIN한 결과)
export type ViewHistoryType = {
  id: string; // "조회 내역"의 고유 ID (view.id)
  viewed_at: string; // "내가 마지막으로 본 시간"
  posts: PostType | null; // JOIN된 "게시물" 정보
};
