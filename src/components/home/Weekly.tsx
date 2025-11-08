import Post from "./Post";

export default function Weekly({ data }: { data: Post[] }) {
  return (
    <>
      {data.map((data) => {
        return <Post key={data.id} data={data} />;
      })}
    </>
  );
}
