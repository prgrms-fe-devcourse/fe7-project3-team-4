import ContentBox from "@/components/ContentBox";
import { Heart, User, X } from "lucide-react";

export default function Page() {
  return (
    <>
      <section className="relative max-w-2xl mx-auto">
        <div className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="ml-2 text-xl font-semibold">게시글 조회 목록</h3>

            <button className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">
              내역 삭제
            </button>
          </div>
          <div className="space-y-4">
            {/* <p className="text-center text-gray-500">게시글 조회 내역이 없습니다.</p> */}
            <ContentBox>
              <div className="p-6 flex gap-5">
                <div className="relative w-11 h-11 shrink-0">
                  <div className="relative w-full h-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <User size={24} className="text-gray-500" />
                    </div>
                  </div>

                  <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <Heart size={20} />
                  </div>
                </div>

                <div className="space-y-2 grow">
                  <p className="text-sm">
                    <span className="font-medium">이름</span>
                    <span className="text-[#717182]">내용</span>
                  </p>

                  <p className="text-sm text-[#111827] line-clamp-1">
                    게시글 제목이름
                  </p>

                  <p
                    className="text-[#717182] text-xs"
                    suppressHydrationWarning={true}
                  >
                    날짜
                  </p>
                </div>

                <button
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 shrink-0 self-start -mr-2 -mt-2" // 정렬 및 디자인
                  aria-label="알림 삭제"
                >
                  <X size={18} />
                </button>
              </div>
            </ContentBox>
          </div>
        </div>
      </section>
    </>
  );
}
