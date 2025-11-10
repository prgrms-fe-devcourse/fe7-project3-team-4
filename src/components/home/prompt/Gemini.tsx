import NoPosts from "../post/NoPosts";
import Post from "../post/Post";

export default function Gemini({ data }: { data: Post[] }) {
  if (!data || data.length === 0) {
    return <NoPosts />;
  }

  return (
    <>
      {data.map((data) => {
        return <Post key={data.id} data={data} />;
      })}
    </>
  );
}
