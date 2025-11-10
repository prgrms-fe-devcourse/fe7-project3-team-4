"use client";

import { Image as ImageIcon, XIcon } from "lucide-react";
import Image from "next/image";
import aiImage from "@/assets/svg/aiImage.svg";

export function MainEditorSection() {
  return (
    <div className="grid bg-white/40 shadow-lg rounded-xl p-6">
      <input
        type="text"
        name="title"
        placeholder="제목"
        className="placeholder-[#A8A8A8] mb-2 border border-[#D9D9D9] rounded-lg pl-4 py-1.5 outline-none"
      />

      <div className="grid border border-[#D9D9D9] rounded-lg p-4">
        <textarea
          name="content"
          placeholder="무엇에 대해 이야기해 볼까요?"
          className="w-full h-[120px] rounded-lg text-[#0A0A0A] placeholder-[#A8A8A8] resize-none focus:outline-none"
        />

        {/* AI 이미지 프리뷰 (임시) */}
        <div className="relative inline-block w-[50px] h-[50px] mt-6 mb-2">
          <Image
            src={aiImage}
            alt="AI illustration"
            className="rounded-lg shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
          />
          <button
            type="button"
            className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm cursor-pointer hover:text-red-500"
          >
            <XIcon size={18} color="#666" />
          </button>
        </div>

        {/* 이미지 업로드 */}
        <label htmlFor="imgFile" className="cursor-pointer w-fit">
          <ImageIcon color="#C7C7CC" />
        </label>
        <input
          type="file"
          id="imgFile"
          accept="image/*"
          className="hidden"
          name="imgFile"
        />
      </div>
    </div>
  );
}
