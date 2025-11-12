import { Copy, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function PromptDetail() {
  return (
    <>
      {/* Top */}
      <div className="flex justify-between px-2">
        <p className="font-bold text-lg text-[#6758FF]">프롬프트와 결과</p>
        <div className="flex gap-2 flex-row text-white items-center">
          <span className="px-3 py-1 rounded-full bg-[#74AA9C] text-xs">
            GPT{/* Gemini */}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#38BDF8] text-xs">
            Text{/* Image */} Output
          </span>
        </div>
      </div>
      {/* 구분선 */}
      <div className="bg-black/40 mt-2 mb-5 w-full h-px"></div>
      {/* 프롬프트 */}
      <div className="flex flex-col gap-5">
        {/* 입력 */}
        <div className="flex flex-col">
          <div className="flex gap-2 items-center mb-2">
            <p className="pl-2">입력한 프롬프트</p>
            {/* 복사 버튼 */}
            <button
              type="button"
              className="cursor-pointer w-6 h-6 top-0 right-0 flex items-center justify-center rounded-md hover:bg-[#6758FF]/80 hover:text-white"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="relative p-4 bg-[#6758FF]/10 border-2 border-white/60 rounded-lg">
            <p className="text-sm">
              내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용
            </p>
          </div>
        </div>
        {/* 결과 */}
        <div className="flex flex-col">
          <div className="flex gap-2 items-center mb-2">
            <p className="pl-2">프롬프트 결과</p>
            {/* 결과 링크로 이동 버튼 */}
            <Link
              href={"https://www.naver.com/"}
              type="button"
              className="cursor-pointer w-6 h-6 top-0 right-0 flex items-center justify-center rounded-md hover:bg-[#6758FF]/80 hover:text-white"
            >
              <ExternalLink size={14} />
            </Link>
          </div>
          <div className="p-4 bg-[#6758FF]/10 border-2 border-white/60 rounded-lg overflow-x-hidden">
            <div className="relative flex justify-center items-center rounded-lg">
              {/* <p className="text-sm">
              내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용
            </p> */}
              <Image
                src={
                  "https://cdn.pixabay.com/photo/2025/10/23/17/29/autumn-9912491_1280.jpg"
                }
                alt="girl"
                width={1000}
                height={500}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
