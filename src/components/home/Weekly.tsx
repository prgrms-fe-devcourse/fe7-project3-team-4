"use client";

import { useMemo, useState } from "react";
import ModelToggle from "./post/ModelToggle";
import TextWeekly from "./weekly/TextWeekly";
import ImgWeekly from "./weekly/ImgWeekly";
import { PostType } from "@/types/Post";
type WeeklyModel = "텍스트" | "이미지";

// [수정] Props 타입 정의 및 핸들러 추가
type WeeklyProps = {
  data: PostType[];
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
};

export default function Weekly({
  data,
  onLikeToggle,
  onBookmarkToggle,
}: WeeklyProps) {
  const [activeModel, setActiveModel] = useState<WeeklyModel>("텍스트");

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
        mode="weekly"
        active={activeModel}
        onChange={setActiveModel}
      />

      {/* [수정] 핸들러 props 전달 */}
      {activeModel === "텍스트" && (
        <TextWeekly
          data={filtered}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
        />
      )}
      {activeModel === "이미지" && (
        <ImgWeekly
          data={filtered}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
        />
      )}
    </>
  );
}

// "use client";

// import { useMemo, useState } from "react";
// import ModelToggle from "./post/ModelToggle";
// import TextWeekly from "./weekly/TextWeekly";
// import ImgWeekly from "./weekly/ImgWeekly";

// type WeeklyModel = "텍스트" | "이미지";

// export default function Weekly({ data }: { data: Post[] }) {
//   const [activeModel, setActiveModel] = useState<WeeklyModel>("텍스트");

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
//         mode="weekly"
//         active={activeModel}
//         onChange={setActiveModel}
//       />

//       {activeModel === "텍스트" && <TextWeekly data={filtered} />}
//       {activeModel === "이미지" && <ImgWeekly data={filtered} />}
//     </>
//   );
// }
