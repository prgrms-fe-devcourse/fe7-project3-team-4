import NoPosts from "./post/NoPosts";
import Post from "./post/Post";
import { PostType } from "@/types/Post";

// [수정] Props 타입 정의 및 핸들러 추가
type FreeProps = {
  data: PostType[];
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
};

export default function Free({
  data,
  onLikeToggle,
  onBookmarkToggle,
}: FreeProps) {
  if (!data || data.length === 0) {
    return <NoPosts />;
  }
  return (
    // [수정] space-y-8 추가 (All.tsx와 일관성)
    <div className="space-y-8">
      {data.map((post) => {
        return (
          <Post
            key={post.id}
            data={post}
            onLikeToggle={onLikeToggle} // [추가]
            onBookmarkToggle={onBookmarkToggle} // [추가]
          />
        );
      })}
    </div>
  );
}

// import NoPosts from "./post/NoPosts";
// import Post from "./post/Post";

// export default function Free({ data }: { data: Post[] }) {
//   if (!data || data.length === 0) {
//     return <NoPosts />;
//   }
//   return (
//     <>
//       {data.map((data) => {
//         return <Post key={data.id} data={data} />;
//       })}
//     </>
//   );
// }
