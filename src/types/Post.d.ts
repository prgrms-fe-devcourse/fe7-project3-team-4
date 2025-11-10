type Post = {
  id: string;
  comment_count: number;
  content: string;
  created_at: string;
  updated_at?: string;
  like_count: number;
  post_type: "prompt" | "free" | "weekly";
  title: string;
  user_id: string;
  view_count: number;

  //join해서 가져올 필드
  email: string;
  image?: string;
  hashtags: string[];

  //supabase 추가해야하는 필드
  isBookmarked: boolean;
  model?: "GPT" | "Gemini" | "텍스트" | "이미지";
};
