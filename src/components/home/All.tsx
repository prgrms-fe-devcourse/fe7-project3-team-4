import NoPosts from "./NoPosts";
import Post from "./Post";

export default function All({ data }: { data: Post[] }) {
  if (!data || data.length === 0) {
    return <NoPosts />;
  }

  return (
    <div className="space-y-8">
      {data.map((post) => (
        <Post key={post.id} data={post} />
      ))}
    </div>
  );
}
