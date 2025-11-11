import Link from "next/link";
import PostActions from "./PostAction";

export default function Post({
  data,
  onLikeToggle,
}: {
  data: Post;
  isPriority?: boolean;
  onLikeToggle?: (id: string) => void;
}) {
  return (
    <>
      <div className="bg-white/40 border border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl">
        <Link href={`/?type=${data.post_type}&id=${data.id}`} className="block">
          <div className="p-6 pb-0">
            <div>
              <div className="flex justify-between"></div>
              <div className="my-5">
                <div className="mb-6 space-y-4">
                  <p className="text-[18px] font-medium">{data.title}</p>
                  <p>{String(data.content)}</p>
                </div>
              </div>
              <div className="space-x-2 text-sm text-[#248AFF]">
                {data.hashtags?.map((tag, i) => (
                  <span key={i}>#{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>
        <PostActions
          postId={data.id}
          likeCount={data.like_count}
          commentCount={data.comment_count}
          onLikeToggle={onLikeToggle}
        />
      </div>
    </>
  );
}
