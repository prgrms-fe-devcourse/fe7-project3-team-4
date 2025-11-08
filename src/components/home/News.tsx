import NoPosts from "./NoPosts";
import Post from "./Post";

export default function News({ data }: { data: Post[] }) {
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
