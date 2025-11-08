import Post from "./Post";

export default function All({ data }: { data: Post[] }) {
  return (
    <>
      <div className="space-y-8">
        {data.map((data) => {
          return <Post key={data.id} data={data} />;
        })}
      </div>
    </>
  );
}
