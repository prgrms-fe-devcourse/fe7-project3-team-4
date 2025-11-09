type Post = {
  id: number;
  type: string;
  model?: string;
  author: string;
  email: string;
  createdAt: string;
  title: string;
  content: string;
  image?: string;
  hashtags: string[];
  likes: number;
  comments: number;
  isBookmarked: boolean;
};
