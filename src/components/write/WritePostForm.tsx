"use client";

import { FormEvent, useState } from "react";
import { PostTypeSelect } from "./PostTypeSelect";
import { MainEditorSection } from "./MainEditorSection";
import { PromptResultSection } from "./PromptResultSection";
import { SelfCheckList } from "./SelfCheckList";

export function WritePostForm() {
  const [postType, setPostType] = useState<PostType>("prompt");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: FormData -> 서버 액션 or API 요청 연결
    // const formData = new FormData(e.currentTarget);
  };

  const isPromptLike = postType === "prompt" || postType === "weekly";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <PostTypeSelect postType={postType} onChange={setPostType} />

      {/* 공통: 제목 + 내용 + 이미지 업로드 */}
      <MainEditorSection />

      {/* 프롬프트 / 주간 챌린지 전용 섹션 */}
      {isPromptLike && (
        <>
          <PromptResultSection />
          <SelfCheckList />
        </>
      )}

      <div className="flex justify-center mb-10">
        <button
          type="submit"
          className="cursor-pointer px-6 py-2.5 rounded-xl bg-[#6758FF] text-white text-lg shadow-sm"
        >
          게시하기
        </button>
      </div>
    </form>
  );
}
