import Post from "../home/post/Post";
import EmptyActivity from "./EmptyActivity";

export default function MyPosts({ posts }: { posts: Post[] }) {
  if (!posts || posts.length === 0) {
    return <EmptyActivity />;
  }
  return (
    <>
      <div className="space-y-4">
        {posts.map((data) => {
          return <Post key={data.id} data={data} />;
        })}
      </div>
    </>
  );
}
