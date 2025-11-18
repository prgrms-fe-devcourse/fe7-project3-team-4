type PostComment = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  like_count: number;
  reply_count: number;
  has_reply: boolean;
  parent_id?: string | null;
  user_id: string;
  profiles?: {
    display_name: string | null;
    email: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    equipped_badge_id?: string | null;
  };
};
