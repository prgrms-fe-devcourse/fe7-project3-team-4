type PostComment = {
  id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  updated_at: string | null;
  //조인으로 가져오는 유저 정보
  display_name: string | null;
  email: string;
  has_reply: boolean;
};
