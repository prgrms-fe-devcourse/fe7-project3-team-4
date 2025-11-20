import Logo from "@/assets/svg/Logo";

interface PromptIntroProps {
  onStartApp: () => void;
}

export default function PromptIntro({ onStartApp }: PromptIntroProps) {
  return (
    <div className="z-50 flex flex-col items-center justify-center text-center p-4">
      <div className="relative min-h-[180px] w-full">
        <p className="dialog-text dialog-1 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-xl font-medium text-neutral-400 opacity-0 md:text-2xl bg-black/70 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none px-3 py-2 md:px-0 md:py-0 rounded-xl md:rounded-none">
          &nbsp;
        </p>
        <p className="dialog-text dialog-2 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-xl font-medium text-neutral-400 opacity-0 md:text-2xl bg-black/70 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none px-3 py-2 md:px-0 md:py-0 rounded-xl md:rounded-none">
          &nbsp;
        </p>
        <p className="dialog-text dialog-3 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-xl font-medium text-neutral-400 opacity-0 md:text-2xl bg-black/70 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none px-3 py-2 md:px-0 md:py-0 rounded-xl md:rounded-none">
          &nbsp;
        </p>
        <div className="final-icon absolute left-1/2 -top-1/5 -translate-x-1/2 -translate-y-1/2 opacity-0">
          {/* 흰색 블러 배경 */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white rounded-full blur-3xl opacity-100" />

          {/* 로고 */}
          <Logo className="relative right-1/2 z-10 w-[180px] h-[170px]" />
        </div>
      </div>
      <h2 className="final-title mt-10 text-4xl font-extrabold text-neutral-100 opacity-0 md:text-5xl">
        AI 프롬프트 & 결과물 커뮤니티
      </h2>
      <p className="final-title opacity-0 text-violet-300 text-lg">
        당신의 아이디어를 AI로 실현하세요
      </p>
      <div className="final-button mt-10 opacity-0">
        <button
          onClick={onStartApp}
          className="cursor-pointer rounded-full bg-[#6758FF] px-8 py-3 text-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:scale-105"
        >
          ALGO 시작하기
        </button>
      </div>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center z-30"></div>
    </div>
  );
}
