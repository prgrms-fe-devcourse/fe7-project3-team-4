import Post from "../home/post/Post";

export default function MyBookMark({ posts }: { posts: Post[] }) {
  return (
    <>
      <div className="space-y-4">
        {posts.map(
          (post) => post.isBookmarked && <Post key={post.id} data={post} />
        )}
      </div>
    </>
  );
}
