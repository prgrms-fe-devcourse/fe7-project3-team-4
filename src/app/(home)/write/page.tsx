"use client";

import { Image as ImageIcon, XIcon } from "lucide-react";
import Image from "next/image";
import aiImage from "../../../assets/svg/aiImage.svg";
import M3Checkbox from "@/components/ui/M3CheckBox";
import { useState } from "react";

type PostType = "prompt" | "free" | "weekly";

export default function Page() {
  const [postType, setPostType] = useState<PostType>("prompt");
  return (
    <>
      <div className="grid gap-y-10">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[#0A0A0A] text-[20px] font-semibold">
            게시글 작성
          </span>
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value as PostType)}
            className="px-6 py-1.5 rounded-lg border border-black/20 bg-white/40 text-[#0A0A0A]"
          >
            <option value="prompt">프롬프트</option>
            <option value="free">자유</option>
            <option value="weekly">주간 챌린지</option>
          </select>
        </div>

        <div className="grid bg-white/40 shadow-lg rounded-xl p-6">
          <input
            type="text"
            style={{ outline: "none" }}
            placeholder="제목"
            className="placeholder-[#A8A8A8] mb-2 border border-[#D9D9D9] rounded-lg pl-4 py-1.5"
          />
          <div className="grid border border-[#D9D9D9] rounded-lg p-4">
            <textarea
              placeholder="무엇에 대해 이야기해 볼까요?"
              className="w-full h-[120px] rounded-lg text-[#0A0A0A] placeholder-[#A8A8A8] resize-none focus:outline-none"
            />
            <div className="relative inline-block w-[50px] h-[50px] mt-6 mb-1.5">
              <Image
                src={aiImage}
                alt="AI illustration"
                className="rounded-lg shadow-[0_4px_4px_rgba(0,0,0,0.25)"
              />
              <XIcon
                size={18}
                color="#666"
                className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm cursor-pointer hover:text-red-500"
              />
            </div>
            <ImageIcon color="#C7C7CC" size={22} />
          </div>
        </div>

        <div className="flex p-0.5 bg-[#248AFF]/20">
          <button className="cursor-pointer py-1 px-3 leading-none rounded-lg bg-white">
            텍스트
          </button>
          <button>이미지</button>
        </div>

        <div className="grid bg-white/40 shadow-lg rounded-xl p-6">
          <div className="flex justify-between">
            <span className="font-semibold text-[20px] mb-[26px]">
              프롬프트 및 결과
            </span>
            <span>gpt/gemini</span>
          </div>
          <textarea
            style={{ outline: "none" }}
            placeholder="입력한 프롬프트"
            className="border border-[#D9D9D9] rounded-lg h-40 mb-10 p-4"
          />
          <textarea
            style={{ outline: "none" }}
            placeholder="프롬프트의 결과"
            className="bg-[#D9D9D9]/20 rounded-lg h-40 p-4"
          />
        </div>

        <div className="grid bg-white/40 shadow-lg rounded-xl p-6">
          <p className="font-semibold text-[20px]">자가진단 문항</p>
          <div className="grid ml-20">
            <div className="flex items-center">
              <M3Checkbox />
              <p>
                프롬프트를 올리기 전에 프롬프트의 성능을 충분히 검증하였나요?
              </p>
            </div>
            <div className="flex items-center">
              <M3Checkbox />
              <p>
                이용규정 및 사회 일반의 통념에 위배되지 않는 프롬프트인가요?
              </p>
            </div>
            <div className="flex items-center">
              <M3Checkbox />
              <p>프롬프트 업로드에 관한 자체 라이선스 규정에 동의하시나요?</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button className="mt-[60px] w-[111px] h-[41px] rounded-xl bg-[#6758FF] text-white text-[18px] shadow-sm">
            게시하기
          </button>
        </div>
      </div>
    </>
  );
}
