"use client";

import { Hashtag } from "@/types";
import { X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { getTranslatedTag } from "@/utils/tagTranslator";

type MainEditorSectionProps = {
  hashtags: Hashtag[];

  // 초기값들
  initialTitle?: string;
  initialSubtitle?: string;
  initialContentJson?: any;
  initialSelectedHashtags?: Hashtag["name"][];
  initialThumbnail?: string;
};

export function MainEditorSection({
  hashtags,
  initialTitle = "",
  initialSubtitle = "",
  initialContentJson,
  initialSelectedHashtags = [],
  initialThumbnail,
}: MainEditorSectionProps) {
  // 최대 글자 수
  const MAX_CONTENT_LENGTH = 3000;

  // 1. initialContentJson에 유효한 content가 있는지 체크
  const hasValidInitialContent =
    initialContentJson &&
    Array.isArray(initialContentJson.content) &&
    initialContentJson.content.length > 0;

  // 2. 에디터 초기 doc를 하나로 정의
  const initialDoc = hasValidInitialContent
    ? initialContentJson
    : initialSubtitle
    ? {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: initialSubtitle }],
          },
        ],
      }
    : {
        type: "doc",
        content: [],
      };

  // 썸네일이 "" 이면 프리뷰 없이
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialThumbnail && initialThumbnail.trim() !== "" ? initialThumbnail : null
  );

  // HashTag
  const [selectedHashtags, setSelectedHashtags] = useState<Hashtag["name"][]>(
    initialSelectedHashtags
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contentJson, setContentJson] = useState<any>(initialDoc);
  const [contentText, setContentText] = useState<string>(initialSubtitle || "");

  // 마지막으로 유효했던 상태 (되돌리기용)
  const lastValidDocRef = useRef<any>(initialDoc);
  const lastValidTextRef = useRef<string>(initialSubtitle || "");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExt,
      Placeholder.configure({ placeholder: "무엇에 대해 이야기해 볼까요?" }),
    ],
    content: initialDoc || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[160px] w-full border border-[#D9D9D9] p-4 rounded-lg focus:outline-none prose prose-sm max-w-none dark:border-[#D9D9D9]/70",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();

      // 3000자 초과 시 이전 유효 상태로 되돌리기
      if (text.length > MAX_CONTENT_LENGTH) {
        // 이전 상태로 롤백
        editor.commands.setContent(lastValidDocRef.current);
        // 커서를 문서 끝으로 이동
        const endPos = editor.state.doc.content.size;
        editor.commands.setTextSelection(endPos);

        // 간단 안내 (원하면 Toast로 교체 가능)
        if (typeof window !== "undefined") {
          window.alert(
            `본문은 최대 ${MAX_CONTENT_LENGTH}자까지 입력할 수 있어요.`
          );
        }
        return;
      }

      // 유효 상태 업데이트
      lastValidDocRef.current = json;
      lastValidTextRef.current = text;

      setContentJson(json);
      setContentText(text);
    },
    immediatelyRender: false,
  });

  const handleImgFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeImgFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleHashtag = (name: Hashtag["name"]) => {
    setSelectedHashtags((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
  };

  return (
    <div className="grid bg-white/40 shadow-xl rounded-xl p-6 gap-4 dark:bg-white/20">
      {/* 제목 */}
      <input
        type="text"
        name="title"
        placeholder="제목"
        defaultValue={initialTitle}
        className="placeholder-[#A8A8A8] border border-[#D9D9D9] rounded-lg pl-4 py-1.5 outline-none dark:border-[#D9D9D9]/70"
      />

      {/* 대표 이미지 업로드 */}
      <input
        ref={fileInputRef}
        id="writeImg"
        accept="image/*"
        className="hidden"
        type="file"
        name="mainImage"
        onChange={handleImgFileUpload}
      />

      <div className="relative flex flex-col items-center py-8 rounded-lg bg-[#D9D9D9]/20 border border-dashed border-[#D9D9D9] dark:border-[#D9D9D9]/70">
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
            <p className="text-[#404040] mb-4 dark:text-[#dfdfdf]">
              Upload image
            </p>
            <label
              htmlFor="writeImg"
              className="px-5 py-3 rounded-xl text-[#404040] bg-[#D0D0D0] cursor-pointer"
            >
              Choose Img File
            </label>
          </>
        )}
      </div>

      {/* Tiptap Editor */}
      <div className="w-full">
        {editor && <EditorContent editor={editor} />}

        {/* 글자 수 카운터 */}
        <div className="mt-1 text-xs text-right text-[#6B7280] dark:text-[#9CA3AF]">
          {contentText.length} / {MAX_CONTENT_LENGTH}자
        </div>

        <input
          type="hidden"
          name="content_raw"
          value={
            contentJson
              ? JSON.stringify(contentJson)
              : JSON.stringify({ type: "doc", content: [] })
          }
        />

        {/* 서브타이틀 텍스트 */}
        <input type="hidden" name="content_text" value={contentText} />
      </div>

      {/* 해시태그 */}
      <p className="ml-2 text-sm">해시태그</p>
      <div className="-mt-2 flex flex-row flex-wrap gap-2">
        {hashtags.map((hashtag) => {
          const active = selectedHashtags.includes(hashtag.name);
          return (
            <button
              key={hashtag.id}
              type="button"
              onClick={() => toggleHashtag(hashtag.name)}
              className={`cursor-pointer px-2.5 py-1.5 text-xs text-[#4B5563] dark:text-[#A6A6DB] border border-[#D9D9D9] rounded-lg dark:border-[#D9D9D9]/70
                ${
                  active
                    ? "bg-[#248AFF] text-white dark:text-white"
                    : "hover:bg-[#daebff]"
                }`}
            >
              #{getTranslatedTag(hashtag.name!)}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="hashtags" value={selectedHashtags.join(",")} />
    </div>
  );
}
