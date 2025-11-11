// src/components/profile/MyPosts.tsx
import Post from "../home/post/Post";
import EmptyActivity from "./EmptyActivity";
import { PostType } from "@/types/Post";

type MyPostsProps = {
  posts: PostType[];
  onLikeToggle: (id: string) => void;
};

export default function MyPosts({ posts, onLikeToggle }: MyPostsProps) {
  if (!posts || posts.length === 0) {
    return <EmptyActivity message="작성한 게시글이 없습니다" />;
  }

  return (
    <div className="space-y-4">
      {posts.map((data) => {
        return (
          <Post
            key={data.id}
            data={data}
            onLikeToggle={onLikeToggle}
          />
        );
      })}
    </div>
  );
}