"use client";

export function PromptResultSection() {
  return (
    <>
      <div className="flex justify-center items-center mt-4">
        <div className="p-0.5 bg-[#248AFF]/20 rounded-lg text-xs">
          <button
            type="button"
            className="cursor-pointer py-1 px-3 leading-none rounded-lg bg-white shadow-2xl"
          >
            텍스트
          </button>
          <button
            type="button"
            className="cursor-pointer py-1 px-3 leading-none rounded-lg text-[#9CA3AF]"
          >
            이미지
          </button>
        </div>
      </div>
      <div className="grid bg-white/40 shadow-lg rounded-xl p-6">
        <div className="flex justify-between mb-6">
          <div className="font-semibold text-xl">프롬프트 및 결과</div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg text-xs bg-white/40 border border-black/20">
            <button
              type="button"
              className="cursor-pointer py-1 px-3 leading-none rounded-lg bg-[#74AA9C] text-white shadow-2xl"
            >
              GPT
            </button>
            <button
              type="button"
              className="cursor-pointer py-1 px-3 leading-none rounded-lg text-[#9CA3AF]"
            >
              이미지
            </button>
          </div>
        </div>

        <textarea
          name="promptInput"
          placeholder="입력한 프롬프트"
          className="border border-[#D9D9D9] rounded-lg h-40 mb-10 p-4 outline-none"
        />
        <textarea
          name="promptResult"
          placeholder="프롬프트의 결과"
          className="bg-[#D9D9D9]/20 rounded-lg h-40 p-4 outline-none"
        />
      </div>
    </>
  );
}
