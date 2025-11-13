import Post from "./post/Post";
import NoPosts from "./post/NoPosts";
import { PostType } from "@/types/Post";

// [✅ 추가] Tab 타입 정의
type Tab = "전체" | "뉴스" | "프롬프트" | "자유" | "주간";

export default function Free({
  data,
  onLikeToggle,
  onBookmarkToggle,
  activeTab, // [✅ 추가]
}: {
  data: PostType[];
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string, type: "post" | "news") => void;
  activeTab: Tab; // [✅ 추가]
}) {
  if (data.length === 0) {
    return <NoPosts />;
  }

  return (
    <div className="space-y-8">
      {data.map((post) => (
        <Post
          key={post.id}
          data={post}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
          activeTab={activeTab} // [✅ 추가]
        />
      ))}
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
