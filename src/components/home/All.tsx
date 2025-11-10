import NoPosts from "./post/NoPosts";
import Post from "./post/Post";

export default function All({ data }: { data: Post[] }) {
  if (!data || data.length === 0) {
    return <NoPosts />;
  }

  return (
    <div className="space-y-8">
      {data.map((post, index) => (
        <Post key={post.id} data={post} isPriority={index === 0}/>
      ))}
    </div>
  );
}
