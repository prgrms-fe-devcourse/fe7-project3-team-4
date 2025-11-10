"use client";

type Props = {
  postType: PostType;
  onChange: (value: PostType) => void;
};

export function PostTypeSelect({ postType, onChange }: Props) {
  return (
    <div className="flex justify-between items-center mb-6">
      <span className="text-[#0A0A0A] text-[20px] font-semibold">
        게시글 작성
      </span>
      <select
        value={postType}
        onChange={(e) => onChange(e.target.value as PostType)}
        className="px-6 py-1.5 rounded-lg border border-black/20 bg-white/40 text-[#0A0A0A]"
        name="postType"
      >
        <option value="prompt">프롬프트</option>
        <option value="free">자유</option>
        <option value="weekly">주간 챌린지</option>
      </select>
    </div>
  );
}
