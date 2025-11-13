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
  };
}

type PromptModel = "GPT" | "Gemini";
