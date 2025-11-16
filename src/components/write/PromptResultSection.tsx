"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useState, ChangeEvent, useId, useRef } from "react";

type PromptResultSectionProps = {
  initialModel: ModelType;
  initialResultMode: ResultMode;
  initialPromptInput?: string;
  initialPromptResult?: string;
  initialResultLink?: string;
};

export function PromptResultSection({
  initialModel,
  initialResultMode,
  initialPromptInput,
  initialPromptResult,
  initialResultLink,
}: PromptResultSectionProps) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialResultMode === "Image" ? initialPromptResult ?? null : null
  );
  const [resultMode, setResultMode] = useState<ResultMode>(
    initialResultMode ? initialResultMode : "Text"
  );
  const [model, setModel] = useState<ModelType>(
    initialModel ? initialModel : "GPT"
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImgFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeImgFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input type="hidden" name="resultMode" value={resultMode} />
      <input type="hidden" name="model" value={model} />

      <div className="grid bg-white/40 shadow-lg rounded-xl p-6 dark:bg-white/20">
        <div className="flex justify-between mb-6">
          <div className="font-semibold text-xl">프롬프트 및 결과</div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg text-xs bg-white/40 border border-black/20">
            <button
              type="button"
              onClick={() => setModel("GPT")}
              className={
                "cursor-pointer py-1 px-3 leading-none rounded-lg transition-shadow " +
                (model === "GPT"
                  ? "bg-[#74AA9C] text-white shadow-2xl"
                  : "text-[#9CA3AF] bg-transparent hover:bg-[#74AA9C]/50 dark:text-white")
              }
            >
              GPT
            </button>
            <button
              type="button"
              onClick={() => setModel("Gemini")}
              className={
                "cursor-pointer py-1 px-3 leading-none rounded-lg transition-shadow " +
                (model === "Gemini"
                  ? "bg-[#4285F4] text-white shadow-2xl"
                  : "text-[#9CA3AF] bg-transparent hover:bg-[#4285F4]/50 dark:text-white")
              }
            >
              Gemini
            </button>
          </div>
        </div>

        {/* 프롬프트 입력 */}
        <textarea
          name="promptInput"
          placeholder="입력한 프롬프트"
          defaultValue={initialPromptInput ?? ""}
          className="border border-[#D9D9D9] rounded-lg h-40 p-4 outline-none mb-8 dark:border-[#D9D9D9]/70"
        />

        <div className="flex flex-col gap-4">
          <div className="flex justify-center items-center">
            <div className="p-0.5 bg-[#248AFF]/20 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setResultMode("Text")}
                className={
                  "cursor-pointer py-1 px-3 leading-none rounded-lg transition-shadow " +
                  (resultMode === "Text"
                    ? "bg-white shadow-2xl dark:bg-[#248AFF]"
                    : "text-[#9CA3AF] dark:text-white")
                }
              >
                텍스트
              </button>
              <button
                type="button"
                onClick={() => setResultMode("Image")}
                className={
                  "cursor-pointer py-1 px-3 leading-none rounded-lg transition-shadow " +
                  (resultMode === "Image"
                    ? "bg-white shadow-2xl dark:bg-[#248AFF]"
                    : "text-[#9CA3AF] dark:text-white")
                }
              >
                이미지
              </button>
            </div>
          </div>

          {/* 결과: 텍스트 or 이미지 */}
          {resultMode === "Text" ? (
            <textarea
              name="promptResult"
              placeholder="프롬프트의 결과"
              defaultValue={initialPromptResult ?? ""}
              className="bg-[#D9D9D9]/30 rounded-lg h-40 p-4 outline-none border border-[#D9D9D9] mb-8 dark:border-[#D9D9D9]/70 dark:bg-[#D9D9D9]/15"
            />
          ) : (
            <>
              <input
                id={inputId}
                accept="image/*"
                className="hidden"
                type="file"
                name="promptResultImage"
                ref={fileInputRef}
                onChange={handleImgFileUpload}
              />
              <div className="relative flex flex-col items-center py-8 rounded-lg bg-[#D9D9D9]/20 border border-dashed border-[#D9D9D9] mb-8 dark:border-[#D9D9D9]/70">
                {previewUrl ? (
                  <>
                    <div className="relative py-2">
                      <Image
                        src={previewUrl}
                        alt="preview"
                        width={400}
                        height={400}
                        className="max-h-52 object-contain rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      className="cursor-pointer absolute top-1.5 right-1.5 p-1 rounded-full text-red-500 border border-[#E5E7EB] bg-white"
                      onClick={removeImgFile}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="absolute top-4 left-4 text-[#7D7E80] mb-2">
                      프롬프트의 결과
                    </p>
                    <p className="text-[#404040] mb-4">Upload image</p>
                    <label
                      htmlFor={inputId}
                      className="px-5 py-3 rounded-xl text-[#404040] bg-[#D0D0D0] cursor-pointer"
                    >
                      Choose Img File
                    </label>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* ✅ 결과 링크 공유 (form에 포함) */}
        <input
          type="url"
          name="resultLink"
          placeholder="결과 링크(https:// …)"
          autoComplete="off"
          className="border border-[#D9D9D9] rounded-lg p-4 outline-none"
          defaultValue={initialResultLink ?? ""}
        />
      </div>
    </>
  );
}
