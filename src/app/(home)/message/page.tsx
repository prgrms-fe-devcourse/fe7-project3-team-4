import { Image as ImageIcon, Search, Send } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-col md:flex-row max-w-[1092px] min-h-[814px] pb-4 rounded-xl shadow-xl">
      {/* 왼쪽 */}
      <div className="flex-1 shirink-0">
        {/* 헤더 - 검색바 */}
        <div className="flex items-center bg-white/40 h-[76px] px-8 shadow-[0_4px_4px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3">
            <Search className="text-[#DBDBDB]" />
            <input
              placeholder="대화 상대 검색..."
              className="w-full focus:outline-none"
            />
          </div>
        </div>
        {/* 목록 */}
        <div className="relative flex items-center gap-3 max-w-[318px] h-[76px] px-8 transition-colors duration-150 hover:bg-[#F2F0FF] cursor-pointer rounded-lg">
          <div className="w-11 h-11 bg-[#6D6D6D] rounded-full">profile</div>
          <div className="">
            <div className="text-[#0A0A0A]">닉네임</div>
            <div className="text-sm text-[#717182]">마지막 메시지</div>
          </div>
          <div className="absolute right-4 text-sm text-[#717182]">
            <span>어제</span>
          </div>
        </div>
        <div className="relative flex items-center gap-3 max-w-[318px] h-[76px] px-8 transition-colors duration-150 hover:bg-[#F2F0FF] cursor-pointer rounded-lg">
          <div className="w-11 h-11 bg-[#6D6D6D] rounded-full">profile</div>
          <div className="">
            <div className="text-[#0A0A0A]">닉네임</div>
            <div className="text-sm text-[#717182]">마지막 메시지</div>
          </div>
          <div className="absolute right-4 text-sm text-[#717182]">
            <span>어제</span>
          </div>
        </div>
        <div className="relative flex items-center gap-3 max-w-[318px] h-[76px] px-8 transition-colors duration-150 hover:bg-[#F2F0FF] cursor-pointer rounded-lg">
          <div className="w-11 h-11 bg-[#6D6D6D] rounded-full">profile</div>
          <div className="">
            <div className="text-[#0A0A0A]">닉네임</div>
            <div className="text-sm text-[#717182]">마지막 메시지</div>
          </div>
          <div className="absolute right-4 text-sm text-[#717182]">
            <span>어제</span>
          </div>
        </div>
      </div>
      {/* 오른쪽 */}
      <div className="flex flex-col">
        {/* 헤더 - 채팅상대 */}
        <div className="relative flex items-center gap-3 h-[76px] p-4 bg-white/40 shadow-[0_4px_4px_rgba(0,0,0,0.1)]">
          <div className="w-11 h-11 bg-[#6D6D6D] rounded-full">profile</div>
          <div className="">
            <div className="text-[#0A0A0A]">닉네임</div>
            <div className="text-sm text-[#717182]">@이메일</div>
          </div>
        </div>
        {/* 채팅 */}
        <div className="relative flex flex-col gap-8 p-4">
          <div className="flex items-end gap-1">
            <div className="self-start max-w-[70%] text-[#0A0A0A] border border-[#6758FF]/30 rounded-xl px-4 py-2">
              안녕하세요! 협업 제안드리고 싶은 게 있어요.
            </div>
            <span className="text-[#717182] text-xs">10:30</span>
          </div>
          <div className="flex justify-end items-end gap-1">
            <span className="text-[#717182] text-xs">10:36</span>
            <div className="self-end max-w-[70%] bg-[#6758FF] text-white border border-[#6758FF]/30 rounded-xl px-4 py-2">
              좋아요! 어떤 프로젝트인지 자세히 알려주세요
            </div>
          </div>
          <div className="flex items-end gap-1">
            <div className="self-start max-w-[70%] text-[#0A0A0A] border border-[#6758FF]/30 rounded-xl px-4 py-2">
              네, 내일 오전에 회의 가능해요!
            </div>
            <span className="text-[#717182] text-xs">10:37</span>
          </div>
        </div>
        {/* 메시지 입력창 */}
        <div className="mt-auto flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3">
          <input
            placeholder="메시지 입력..."
            className="w-full focus:outline-none"
          />
          <ImageIcon className="text-[#717182] w-6 h-6" strokeWidth={1} />

          <div className="bg-[#6758FF] p-1.5 rounded-md">
            <Send className="text-white w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
