// src/components/profile/MyPosts.tsx
import Post from "../home/post/Post";
import EmptyActivity from "./EmptyActivity";
import { Post as PostType } from "@/types"; // [⭐️] 타입 명시

type MyPostsProps = {
  posts: PostType[];
  onLikeToggle: (id: string) => void; // [⭐️]
};

export default function MyPosts({ posts, onLikeToggle }: MyPostsProps) { // [⭐️]
  if (!posts || posts.length === 0) {
    return <EmptyActivity message="작성한 게시글이 없습니다" />;
  }
  return (
    <>
      <div className="space-y-4">
        {posts.map((data) => {
          return (
            <Post
              key={data.id}
              data={data}
              onLikeToggle={onLikeToggle} // [⭐️] Post 좋아요 핸들러 전달
              // '내 게시글' 탭에서는 북마크 버튼이 '추가' 기능이므로
              // '해제' 기능인 onBookmarkToggle을 전달하지 않음.
              // (Post 컴포넌트의 onBookmarkToggle은 옵셔널'?'이어야 함)
            />
          );
        })}
      </div>
    </>
  );
}