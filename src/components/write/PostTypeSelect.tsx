"use client";

import { ChevronDown } from "lucide-react";

type Props = {
  postType: PostType;
  onChange: (value: PostType) => void;
  // 수정 모드에서 타입 변경을 막기 위한 플래그
  isLocked?: boolean;
};

export function PostTypeSelect({
  postType,
  onChange,
  isLocked = false,
}: Props) {
  return (
    <div className="flex justify-between items-center mb-6">
      <span className="text-xl font-semibold">게시글 작성</span>

      <div className="flex items-center gap-2">
        {isLocked && (
          <span className="text-xs text-[#717182]">
            수정 시에는 게시글 타입을 변경할 수 없어요.
          </span>
        )}
        <div className="relative">
          <select
            name="postType"
            value={postType}
            onChange={(e) => onChange(e.target.value as PostType)}
            disabled={isLocked}
            className={`block w-full bg-gray-900/10 dark:bg-gray-900/60 text-sm border border-white/20 focus:outline-none px-6 py-1.5 rounded-lg ${
              isLocked ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <option value="prompt">프롬프트</option>
            <option value="free">자유</option>
            <option value="weekly">주간 챌린지</option>
          </select>
        </div>
      </div>
    </div>
  );
}
