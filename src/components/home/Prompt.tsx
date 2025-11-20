"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Gemini from "./prompt/Gemini";
import Gpt from "./prompt/Gpt";
import ModelToggle from "./post/ModelToggle";
type PromptModel = "GPT" | "Gemini";
import { PostType } from "@/types/Post";

// [수정] Props 타입 정의 및 핸들러 추가
type PromptProps = {
  data: PostType[];
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
  activeSubType: string | null;
};

export default function Prompt({
  data,
  onLikeToggle,
  onBookmarkToggle,
  activeSubType,
}: PromptProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModel, setActiveModel] = useState<PromptModel>(() => {
    if (activeSubType === "Gemini") return "Gemini";
    return "GPT";
  });

  const handleModelChange = (model: PromptModel) => {
    setActiveModel(model);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sub_type", model);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const filtered = useMemo(
    () =>
      data.filter(
        (post) => post.model?.toLowerCase() === activeModel.toLowerCase()
      ),
    [data, activeModel]
  );

  return (
    <>
      <ModelToggle
        mode="prompt"
        active={activeModel}
        onChange={handleModelChange}
      />

      {/* [수정] 핸들러 props 전달 */}
      {activeModel === "GPT" && (
        <Gpt
          data={filtered}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
          subType={activeModel}
        />
      )}
      {activeModel === "Gemini" && (
        <Gemini
          data={filtered}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
          subType={activeModel}
        />
      )}
    </>
  );
}
// "use client";

// import { useState, useMemo } from "react";
// import Gemini from "./prompt/Gemini";
// import Gpt from "./prompt/Gpt";
// import ModelToggle from "./post/ModelToggle";

// type PromptModel = "GPT" | "Gemini";

// export default function Prompt({ data }: { data: Post[] }) {
//   const [activeModel, setActiveModel] = useState<PromptModel>("GPT");

//   const filtered = useMemo(
//     () =>
//       data.filter(
//         (post) => post.model?.toLowerCase() === activeModel.toLowerCase()
//       ),
//     [data, activeModel]
//   );

//   return (
//     <>
//       <ModelToggle
//         mode="prompt"
//         active={activeModel}
//         onChange={setActiveModel}
//       />

//       {activeModel === "GPT" && <Gpt data={filtered} />}
//       {activeModel === "Gemini" && <Gemini data={filtered} />}
//     </>
//   );
// }
