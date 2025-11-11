// types/Post.ts
import { Json } from "@/utils/supabase/supabase";

export interface PostType {
  id: string;
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
  user_id: string;
  
  // profiles 테이블에서 조회한 데이터
  profiles?: {
    display_name: string | null;
    email: string | null;
    avatar_url?: string | null; // [추가]
  };
}