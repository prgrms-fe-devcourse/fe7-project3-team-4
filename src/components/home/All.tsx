import { Bookmark, Heart, MessageSquare } from "lucide-react";

export default function All() {
  return (
    <>
      <div className="space-y-8">
        {/* 뉴스 게시글 */}
        <div className="p-6 bg-white/40 border-white/20 rounded-xl shadow-[0px_10px_25px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)]">
          {/* 게시글 정보 */}
          <div className="mb-7">
            {/* 작성자 정보 */}
            <div className="flex justify-between">
              <div className="flex gap-3 items-center">
                {/* 프로필 이미지 */}
                <div className="w-11 h-11 bg-gray-300 rounded-full"></div>
                {/* 이름, 이메일, 작성 시간?날짜? */}
                <div className="space-y-1 leading-none">
                  <p>GPT News</p>
                  <p className="text-[#717182] text-sm">
                    @skyt852@gmail.com · 2시간 전
                  </p>
                </div>
              </div>
              <div className="h-[22px] text-xs text-white px-3 py-1 bg-[#74AA9C] rounded-full">
                GPT
              </div>
            </div>
            {/* 게시글 내용 */}
            <div className="my-5">
              {/* 제목 */}
              <div className="mb-6">
                <div className="text-[18px]">뉴스 제목</div>
              </div>
              {/* 썸네일(이미지) */}
              <div className="w-full h-60 bg-gray-300 rounded-lg"></div>
            </div>
            {/* 태그들 */}
            <div className="space-x-2 text-sm text-[#248AFF]">
              <span>#마케팅</span>
              <span>#소통</span>
              <span>#업데이트</span>
            </div>
          </div>
          {/* 아래 버튼들 */}
          <div className="flex justify-center gap-30">
            <button className="cursor-pointer py-1 px-2 rounded-sm hover:text-[#FF569B] hover:bg-[#F7E6ED]">
              <div className="flex gap-2 text-sm items-center ">
                <Heart size={18} />
                <span>234</span>
              </div>
            </button>
            <button className="cursor-pointer py-1 px-2 rounded-sm hover:bg-gray-200">
              <div className="flex gap-2 text-sm items-center">
                <MessageSquare size={18} />
                <span>45</span>
              </div>
            </button>
            <button className="cursor-pointer py-1 px-2 rounded-sm hover:text-[#6758FF] hover:bg-[#D8D4FF]">
              <Bookmark size={18} />
            </button>
          </div>
        </div>

        {/* 자유 게시글 */}
        <div className="p-6 bg-white/40 border-white/20 rounded-xl shadow-[0px_10px_25px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)]">
          {/* 게시글 정보 */}
          <div className="mb-7">
            {/* 작성자 정보 */}
            <div className="flex justify-between">
              <div className="flex gap-3 items-center">
                {/* 프로필 이미지 */}
                <div className="w-11 h-11 bg-gray-300 rounded-full"></div>
                {/* 이름, 이메일, 작성 시간?날짜? */}
                <div className="space-y-1 leading-none">
                  <p>GPT News</p>
                  <p className="text-[#717182] text-sm">
                    @skyt852@gmail.com · 2시간 전
                  </p>
                </div>
              </div>
              {/* <div className="h-[22px] text-xs text-white px-3 py-1 bg-[#74AA9C] rounded-full">
              GPT
            </div> */}
            </div>
            {/* 게시글 내용 */}
            <div className="my-5">
              {/* 제목 */}
              <div className="mb-6">
                <div className="text-[18px]">뉴스 제목</div>
              </div>
              {/* 썸네일(이미지) */}
              <div className="w-full h-60 bg-gray-300 rounded-lg"></div>
            </div>
            {/* 태그들 */}
            <div className="space-x-2 text-sm text-[#248AFF]">
              <span>#마케팅</span>
              <span>#소통</span>
              <span>#업데이트</span>
            </div>
          </div>
          {/* 아래 버튼들 */}
          <div className="flex justify-center gap-30">
            <button className="cursor-pointer py-1 px-2 rounded-sm hover:text-[#FF569B] hover:bg-[#F7E6ED]">
              <div className="flex gap-2 text-sm items-center ">
                <Heart size={18} />
                <span>234</span>
              </div>
            </button>
            <button className="cursor-pointer py-1 px-2 rounded-sm hover:bg-gray-200">
              <div className="flex gap-2 text-sm items-center">
                <MessageSquare size={18} />
                <span>45</span>
              </div>
            </button>
            <button className="cursor-pointer py-1 px-2 rounded-sm hover:text-[#6758FF] hover:bg-[#D8D4FF]">
              <Bookmark size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
