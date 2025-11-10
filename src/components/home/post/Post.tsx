// src/components/home/post/Post.tsx
import { Heart, MessageSquare } from "lucide-react";
import Link from "next/link";


export default function Post({
  data,
  onLikeToggle,
}: {
  data: Post; 
  isPriority?: boolean;
  onLikeToggle?: (id: string) => void;
}) {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLikeToggle?.(data.id);
  };

  return (
    <>
      <div className="bg-white/40 border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl">
        <Link
          href={`/?type=${data.post_type}&id=${data.id}`}
          className="block"
        >
          <div className="p-6 pb-0">
            <div>
              <div className="flex justify-between">
              </div>
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
        <div className="flex justify-center gap-30 text-[#717182] py-6">
          <button
            className="cursor-pointer py-1 px-2 rounded-md hover:text-[#FF569B] hover:bg-[#F7E6ED]"
            onClick={handleLikeClick}
            disabled={!onLikeToggle}
          >
            <div className="flex gap-2 text-sm items-center ">
              <Heart size={18} />
              <span>{data.like_count}</span>
            </div>
          </button>
          <button className="cursor-pointer py-1 px-2 rounded-md hover:bg-gray-200">
            <div className="flex gap-2 text-sm items-center">
              <MessageSquare size={18} />
              <span>{data.comment_count}</span>
            </div>
          </button>
          
        </div>
      </div>
    </>
  );
}