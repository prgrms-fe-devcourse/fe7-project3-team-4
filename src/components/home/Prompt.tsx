"use client";

import { useState, useMemo } from "react";
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
};

export default function Prompt({
  data,
  onLikeToggle,
  onBookmarkToggle,
}: PromptProps) {
  const [activeModel, setActiveModel] = useState<PromptModel>("GPT");

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
        onChange={setActiveModel}
      />

      {/* [수정] 핸들러 props 전달 */}
      {activeModel === "GPT" && (
        <Gpt
          data={filtered}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
        />
      )}
      {activeModel === "Gemini" && (
        <Gemini
          data={filtered}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
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
