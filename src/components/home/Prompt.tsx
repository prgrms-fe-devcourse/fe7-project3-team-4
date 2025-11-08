"use client";

import { useState, useMemo } from "react";
import Gemini from "./Gemini";
import Gpt from "./Gpt";
import ModelToggle from "./ModelToggle";

type PromptModel = "GPT" | "Gemini";

export default function Prompt({ data }: { data: Post[] }) {
  const [activeModel, setActiveModel] = useState<PromptModel>("GPT");

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
        mode="prompt"
        active={activeModel}
        onChange={setActiveModel}
      />

      {activeModel === "GPT" && <Gpt data={filtered} />}
      {activeModel === "Gemini" && <Gemini data={filtered} />}
    </>
  );
}
