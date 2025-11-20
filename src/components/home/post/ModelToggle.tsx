"use client";

import { PromptModel, WeeklyModel } from "@/types/Post";

type ModelToggleProps =
  | {
      mode: "prompt";
      active: PromptModel;
      onChange: (value: PromptModel) => void;
    }
  | {
      mode: "weekly";
      active: WeeklyModel;
      onChange: (value: WeeklyModel) => void;
    };

export default function ModelToggle(props: ModelToggleProps) {
  const baseBtn =
    "leading-none px-3 py-1 cursor-pointer rounded-lg transition-colors text-xs";

  return (
    <div className="inline-flex bg-white/70 text-sm p-0.5 rounded-lg border border-white/60 space-x-1 mb-6 dark:bg-white/40">
      {props.mode === "prompt" && (
        <>
          <button
            type="button"
            onClick={() => props.onChange("GPT")}
            className={
              baseBtn +
              (props.active === "GPT"
                ? " bg-[#74AA9C] text-white"
                : " bg-transparent text-[#717182] hover:bg-[#74aa9c1f] dark:text-white")
            }
          >
            GPT
          </button>
          <button
            type="button"
            onClick={() => props.onChange("Gemini")}
            className={
              baseBtn +
              (props.active === "Gemini"
                ? " bg-[#2FBAD2] text-white"
                : " bg-transparent text-[#717182] hover:bg-[#2fbad21f] dark:text-white")
            }
          >
            Gemini
          </button>
        </>
      )}

      {props.mode === "weekly" && (
        <>
          <button
            type="button"
            onClick={() => props.onChange("Text")}
            className={
              baseBtn +
              (props.active === "Text"
                ? " bg-[#6758FF] text-white"
                : " bg-transparent text-[#717182] hover:bg-[#ECE9FF] dark:text-white")
            }
          >
            텍스트
          </button>
          <button
            type="button"
            onClick={() => props.onChange("Image")}
            className={
              baseBtn +
              (props.active === "Image"
                ? " bg-[#FF569B] text-white"
                : " bg-transparent text-[#717182] hover:bg-[#FFE5F0] dark:text-white")
            }
          >
            이미지
          </button>
        </>
      )}
    </div>
  );
}
