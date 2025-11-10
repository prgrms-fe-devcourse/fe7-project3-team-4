import { Bookmark, Heart, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Post({ data }: { data: Post }) {
  return (
    <>
      <div className="bg-white/40 border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl">
        <Link
          href={`/?type=${data.post_type}&id=${data.id}`}
          scroll={false}
          className="block"
        >
          <div className="p-6 pb-0">
            {/* 게시글 정보 */}
            <div>
              {/* 작성자 정보 */}
              <div className="flex justify-between">
                <div className="flex gap-3 items-center">
                  {/* 프로필 이미지 */}
                  <div className="w-11 h-11 bg-gray-300 rounded-full"></div>
                  {/* 이름, 이메일, 작성 시간?날짜? */}
                  <div className="space-y-1 leading-none">
                    <p>{data.user_id}</p>
                    <p className="text-[#717182] text-sm">
                      {data.email} · {data.created_at.slice(0, 10)}
                    </p>
                  </div>
                </div>
                {data.model && (
                  <div
                    className={`h-[22px] text-xs font-semibold text-white px-3 py-1 ${
                      (data.model === "GPT" && "bg-[#74AA9C]") ||
                      (data.model === "Gemini" && "bg-[#2FBAD2]") ||
                      (data.model === "텍스트" && "bg-[#6758FF]") ||
                      (data.model === "이미지" && "bg-[#FF569B]")
                    } 
                     rounded-full`}
                  >
                    {data.model}
                  </div>
                )}
              </div>
              {/* 게시글 내용 */}
              <div className="my-5">
                {/* 제목 */}
                <div className="mb-6 space-y-4">
                  <p className="text-[18px] font-medium">{data.title}</p>
                  <p>{data.content}</p>
                </div>
                {/* 썸네일(이미지) */}
                {data.image && (
                  <Image
                    src={data.image}
                    alt={data.title}
                    width={800}
                    height={800}
                    className="object-cover w-full h-auto bg-gray-300 rounded-lg"
                  ></Image>
                )}
              </div>
              {/* 태그들 */}
              <div className="space-x-2 text-sm text-[#248AFF]">
                {data.hashtags.map((tag, i) => (
                  <span key={i}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>
        {/* 아래 버튼들 */}
        <div className="flex justify-center gap-30 text-[#717182] py-6">
          <button className="cursor-pointer py-1 px-2 rounded-md hover:text-[#FF569B] hover:bg-[#F7E6ED]">
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
          <button
            className={`cursor-pointer py-1 px-2 rounded-md hover:text-[#6758FF] hover:bg-[#D8D4FF] ${
              data.isBookmarked ? "text-[#6758FF] bg-[#D8D4FF]" : ""
            }`}
          >
            <Bookmark size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
