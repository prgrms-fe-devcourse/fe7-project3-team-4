import NoPosts from "../post/NoPosts";
import Post from "../post/Post";
import { PostType } from "@/types/Post";

type TextWeeklyProps = {
  data: PostType[];
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
  subType: "Text" | "Image"; // [✅ 추가]
};

export default function TextWeekly({
  data,
  onLikeToggle,
  onBookmarkToggle,
  subType, // [✅ 추가]
}: TextWeeklyProps) {
  if (!data || data.length === 0) {
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
          subType={subType} // [✅ 추가]
        />
      ))}
    </div>
  );
}

// import NoPosts from "../post/NoPosts";
// import Post from "../post/Post";

// export default function TextWeekly({ data }: { data: Post[] }) {
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
