"use client";

import { useMemo, useState } from "react";
import ModelToggle from "./ModelToggle";
import Post from "./Post";
import TextWeekly from "./weekly/TextWeekly";
import ImgWeekly from "./weekly/ImgWeekly";

type WeeklyModel = "텍스트" | "이미지";

export default function Weekly({ data }: { data: Post[] }) {
  const [activeModel, setActiveModel] = useState<WeeklyModel>("텍스트");

  const filtered = useMemo(
    () =>
      data.filter(
        (post) =>
          post.type === "prompt" &&
          post.model?.toLowerCase() === activeModel.toLowerCase()
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

      {activeModel === "텍스트" && <TextWeekly data={filtered} />}
      {activeModel === "이미지" && <ImgWeekly data={filtered} />}
    </>
  );
}
