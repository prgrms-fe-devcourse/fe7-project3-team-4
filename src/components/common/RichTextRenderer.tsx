"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Json } from "@/utils/supabase/supabase";
import { useEffect } from "react";
import NextImage from "next/image";
import Link from "next/link";

export default function RichTextRenderer({
  content,
  imageOnly = false,
  showImage = true, // 이미지 표시 여부
  postId,
  postType,
  title,
}: {
  content: Json | null;
  imageOnly?: boolean; // true면 이미지만, false면 전체 콘텐츠
  showImage?: boolean; // 이미지를 렌더링할지 여부
  postId?: string;
  postType?: string;
  title?: string;
}) {
  // 이미지만 표시하는 경우
  if (imageOnly) {
    const images = extractImages(content);

    if (images.length === 0) {
      return null; // 이미지 없으면 아무것도 렌더링 안함
    }

    return (
      <div
        aria-label={title}
        className="block relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200"
      >
        <NextImage
          src={images[0]}
          alt={title || ""}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    );
  }

  // 전체 콘텐츠 표시 (텍스트 + 이미지 또는 텍스트만)
  const filteredContent = showImage ? content : filterOutImages(content);

  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    content: "",
    extensions: [
      StarterKit.configure({
        history: false,
        dropcursor: false,
        gapcursor: false,
        codeBlock: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none",
      },
    },
  });

  useEffect(() => {
    if (editor && filteredContent) {
      editor.commands.setContent(filteredContent, false);
    }
  }, [editor, filteredContent]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
}

// 이미지 URL 추출
function extractImages(content: any): string[] {
  if (!content || typeof content !== "object") return [];

  const images: string[] = [];

  const traverse = (node: any) => {
    if (node.type === "image" && node.attrs?.src) {
      images.push(node.attrs.src);
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  };

  if (content.type === "doc" && content.content) {
    content.content.forEach(traverse);
  }

  return images;
}

// 이미지 노드 제거
function filterOutImages(content: any): any {
  if (!content || typeof content !== "object") {
    return content;
  }

  const filterNode = (node: any): any => {
    if (node.type === "image") {
      return null; // 이미지 노드 제거
    }

    if (node.content && Array.isArray(node.content)) {
      const filteredContent = node.content
        .map(filterNode)
        .filter((n: any) => n !== null);

      return {
        ...node,
        content: filteredContent.length > 0 ? filteredContent : undefined,
      };
    }

    return node;
  };

  if (content.type === "doc" && content.content) {
    const filteredContent = content.content
      .map(filterNode)
      .filter((n: any) => n !== null);

    return {
      type: "doc",
      content: filteredContent,
    };
  }

  return content;
}
