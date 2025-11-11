"use client";

import { Hashtag } from "@/types";
import { Image as X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useState } from "react";

export function MainEditorSection({ hashtags }: { hashtags: Hashtag[] }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<Hashtag["name"][]>(
    []
  );

  const handleImgFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeImgFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const toggleHashtag = (name: Hashtag["name"]) => {
    setSelectedHashtags((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
  };

  return (
    <div className="grid bg-white/40 shadow-lg rounded-xl p-6 gap-4">
      <input
        type="text"
        name="title"
        placeholder="제목"
        className="placeholder-[#A8A8A8] border border-[#D9D9D9] rounded-lg pl-4 py-1.5 outline-none"
      />

      <div className="relative flex flex-col items-center py-8 rounded-lg bg-[#D9D9D9]/20 border border-dashed border-[#D9D9D9]">
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
            <input
              id="writeImg"
              accept="image/*"
              className="hidden"
              type="file"
              name="mainImage"
              onChange={handleImgFileUpload}
            />
            <p className="text-[#404040] mb-4">Upload image</p>
            <label
              htmlFor="writeImg"
              className="px-5 py-3 rounded-xl text-[#404040] bg-[#D0D0D0] cursor-pointer"
            >
              Choose Img File
            </label>
          </>
        )}
      </div>

      <textarea
        name="content"
        placeholder="무엇에 대해 이야기해 볼까요?"
        className="w-full h-[120px] border border-[#D9D9D9] p-4 rounded-lg text-[#0A0A0A] placeholder-[#A8A8A8] resize-none focus:outline-none"
      />

      <p className="ml-2 text-sm">해시태그</p>
      <div className="-mt-2 flex flex-row flex-wrap gap-2">
        {hashtags.map((hashtag) => {
          const active = selectedHashtags.includes(hashtag.name);
          return (
            <button
              key={hashtag.id}
              type="button"
              onClick={() => toggleHashtag(hashtag.name)}
              className={`cursor-pointer px-2.5 py-1.5 text-xs text-[#4B5563] border border-[#D9D9D9] rounded-lg 
                  ${active ? "bg-[#248AFF] text-white" : "hover:bg-[#daebff]"}`}
            >
              #{hashtag.name}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="hashtags" value={selectedHashtags.join(",")} />
    </div>
  );
}
