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
  image?: string | null;
  view_count: number;
  email: string;
  hashtags: string[];
  model?: "GPT" | "Gemini" | "텍스트" | "이미지";
  isBookmarked?: boolean;
};
