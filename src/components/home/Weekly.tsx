"use client";

import { useState } from "react";
import ModelToggle from "./ModelToggle";
import Post from "./Post";

type WeeklyModel = "텍스트" | "이미지";

export default function Weekly({ data }: { data: Post[] }) {
  const [activeModel, setActiveModel] = useState<WeeklyModel>("텍스트");

  return (
    <>
      <ModelToggle
        mode="weekly"
        active={activeModel}
        onChange={setActiveModel}
      />

      {data.map((data) => {
        return <Post key={data.id} data={data} />;
      })}
    </>
  );
}
