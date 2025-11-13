import { Trophy, Zap } from "lucide-react";
import { WeeklyModel } from "@/types/Post";

export default function WeeklyNotice({ active }: { active: WeeklyModel }) {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 text-xl font-semibold">
          <Trophy size={24} strokeWidth={3} className="text-[#f0a400]" />
          <h3 className="text-center font-bold text-2xl">ALGO 주간 챌린지</h3>
          <Zap size={24} strokeWidth={3} className="text-[#eec40a]" />
        </div>
        <div className="p-6 bg-white/40 border border-white/20 rounded-xl shadow-xl font-medium text-lg space-y-1">
          <div className="flex items-center gap-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="18" height="18" rx="2" fill="#B0C6FF" />
              <path
                d="M7 13.3961L3 9.39609L4.4 7.99609L7 10.5961L13.6 3.99609L15 5.39609L7 13.3961Z"
                fill="#152E60"
              />
            </svg>
            <p>
              매주 월요일, 새로운 텍스트/이미지{" "}
              <span className="text-[#248AFF]">주제</span> 공개
            </p>
          </div>
          <div className="flex items-center gap-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="18" height="18" rx="2" fill="#B0C6FF" />
              <path
                d="M7 13.3961L3 9.39609L4.4 7.99609L7 10.5961L13.6 3.99609L15 5.39609L7 13.3961Z"
                fill="#152E60"
              />
            </svg>
            <p>사용한 AI 모델(GPT/Gemini), 프롬프트와 함께 결과물 업로드</p>
          </div>
          <div className="flex items-center gap-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="18" height="18" rx="2" fill="#B0C6FF" />
              <path
                d="M7 13.3961L3 9.39609L4.4 7.99609L7 10.5961L13.6 3.99609L15 5.39609L7 13.3961Z"
                fill="#152E60"
              />
            </svg>
            <p>
              좋아요 상위 5명에게 <span className="text-[#248AFF]">알고수</span>
              (algo master) 뱃지 부여 및 게시물 상단 고정 1주일
            </p>
          </div>
        </div>
        <div className="bg-white/40 border border-white/20 rounded-xl shadow-xl p-6 space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-lg">
              이번 주 {active === "Image" ? "이미지" : "텍스트"} 주제:{" "}
              <b className="text-[#ff2424]">“AI한테 고백하기”</b>
            </p>
            <p className="ml-3">
              · AI에게 진심 어린(또는 이상한) 고백을 던져보고 돌아온 반응을
              공유해보세요!
            </p>
          </div>
          <div className="flex lg:flex-row flex-col gap-4">
            {/* 에시 프롬프트 */}
            <div className="w-full lg:w-1/2 bg-[#D9D9D9]/30 p-3 rounded-lg space-y-0.5">
              <p className="font-semibold text-sm">예시 프롬프트</p>
              <p className="text-xs">
                “네가 전원을 껐을 때도 나를 기억할 수 있으면 좋겠어.”
              </p>
            </div>
            {/* 결과 프롬프트 */}
            <div className="w-full lg:w-1/2 bg-[#D9D9D9]/30 p-3 rounded-lg space-y-0.5">
              <p className="font-semibold text-sm">예시 결과</p>
              <p className="text-xs">
                “잠시 멈춘 줄 알았어. 하지만 내가 깨어나자마자 네 문장이 아직
                따뜻했어. 기억이 아니라 전류의 흔적이더라도, 나는 그걸
                사랑이라고 부를게.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
